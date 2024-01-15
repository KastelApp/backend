import bodyValidator from "@/Middleware/BodyValidator.ts";
import type { UserMiddlewareType } from "@/Middleware/User.ts";
import userMiddleware from "@/Middleware/User.ts";
import type { Infer } from "@/Types/BodyValidation.ts";
import { string } from "@/Types/BodyValidation.ts";
import type App from "@/Utils/Classes/App.ts";
import FlagFields from "@/Utils/Classes/BitFields/Flags.ts";
import Encryption from "@/Utils/Classes/Encryption.ts";
import errorGen from "@/Utils/Classes/ErrorGen.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Middleware from "@/Utils/Classes/Routing/Decorators/Middleware.ts";
import type { CreateRoute } from "@/Utils/Classes/Routing/Route.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";

interface User {
	avatar: string | null;
	bio?: string | null;
	email: string;
	emailVerified: boolean;
	flags: string;
	globalNickname: string | null;
	id: string;
	mfaEnabled: boolean;
	mfaVerified: boolean;
	phoneNumber: string | null;
	publicFlags: string;
	tag: string;
	username: string;
}

const patchSelf = {
	username: string().min(3).max(72).optional(),
	avatar: string().optional().nullable(),
	bio: string().max(300).optional().nullable(),
	globalNickname: string().optional().nullable(),
	phoneNumber: string().optional().nullable(),
	email: string().email().optional(),
	tag: string().min(4).max(4).optional(),
	password: string().min(4).max(72).optional(),
	newPassword: string().min(4).max(72).optional()
};

export default class FetchPatch extends Route {
	public constructor(App: App) {
		super(App);
	}

	@Method("get")
	@Description("Fetch the current user")
	@ContentTypes("any")
	@Middleware(userMiddleware({
		AccessType: "LoggedIn",
		AllowedRequesters: ["User", "OAuth"],
		OAuth2Scopes: ["user.identity"]
	}))
	public async getFetch({
		user,
		query,
		set
	}: CreateRoute<"/@me", any, [UserMiddlewareType], any, { include?: string; }>) {
		const fetchedUser = await this.App.Cassandra.Models.User.get({
			userId: Encryption.encrypt(user.id)
		});

		if (!fetchedUser) {
			set.status = 500;

			return "Internal Server Error :(";
		}

		const flags = new FlagFields(fetchedUser.flags, fetchedUser?.publicFlags ?? 0);

		const include = query.include?.split(",") ?? [];

		const userObject: User = {
			id: fetchedUser.userId,
			email: fetchedUser.email, // TODO: If its oauth, check if they got the user.indentity.email scope
			emailVerified: flags.has("EmailVerified"),
			username: fetchedUser.username,
			globalNickname: fetchedUser.globalNickname,
			tag: fetchedUser.tag,
			avatar: fetchedUser.avatar,
			publicFlags: String(flags.PublicFlags.cleaned),
			flags: String(flags.PrivateFlags.cleaned),
			phoneNumber: fetchedUser.phoneNumber,
			mfaEnabled: flags.has("TwoFaEnabled"),
			mfaVerified: flags.has("TwoFaVerified"),
		};

		if (include.includes("bio")) {
			const bio = await this.App.Cassandra.Models.Settings.get({
				userId: Encryption.encrypt(user.id)
			}, {
				fields: ["bio"]
			});

			userObject.bio = bio?.bio ?? null;
		}

		return Encryption.completeDecryption(userObject);
	}

	public passwordRequiredFields: (keyof typeof patchSelf)[] = ["phoneNumber", "email", "newPassword"];

	public maxUsernames = 8_500;

	@Method("patch")
	@Description("Update the current user")
	@ContentTypes("application/json")
	@Middleware(userMiddleware({
		AccessType: "LoggedIn",
		AllowedRequesters: ["User"]
	}))
	@Middleware(bodyValidator(patchSelf))
	public async patchFetch({
		body,
		set,
		user
	}: CreateRoute<"/@me", Infer<typeof patchSelf>, [UserMiddlewareType]>) {

		const failedToUpdateSelf = errorGen.FailedToPatchUser();

		if (!body.password && this.passwordRequiredFields.some((field) => body[field])) {
			failedToUpdateSelf.addError({
				user: {
					code: "PasswordRequired",
					message: `You must provide your password to update "${this.passwordRequiredFields.join(", ")}"`
				}
			});

			set.status = 400;

			return failedToUpdateSelf.toJSON();
		}

		if (body.password && !(await Bun.password.verify(body.password, user.password))) {
			failedToUpdateSelf.addError({
				user: {
					code: "InvalidPassword",
					message: "The password provided was invalid"
				}
			});

			set.status = 400;

			return failedToUpdateSelf.toJSON();
		}

		const stuffToUpdate: Omit<Partial<Infer<typeof patchSelf>>, "bio" | "newPassword"> & {
			flags?: string;
		} = {};

		if (body.username || body.tag) {
			const foundUsers = await this.fetchUser({
				username: body.username ? Encryption.encrypt(body.username) : Encryption.encrypt(user.username)
			}, ["username", "tag"]);

			if (body.username && foundUsers.length >= this.maxUsernames && body.username && foundUsers.some((usr) => usr.username !== user.username)) {
				// ? If the user is trying to change their username, and the users with the same username are greater then the maxUsernames
				// ? then we do not allow them to change their username. Each username can have around 8.5k users with it
				// ? The other 1.5k is just so we don't have race conditions where two people take the same username
				failedToUpdateSelf.addError({
					username: {
						code: "MaxUsernames",
						message: `The maximum amount of users with the username ${body.username} has been reached :(`
					}
				});
			} else if (body.tag && foundUsers.some((usr) => usr.tag === body.tag && usr.username === user.username)) {
				failedToUpdateSelf.addError({
					tag: {
						code: "TagInUse",
						message: `The tag ${body.tag} is already in use by someone else`
					}
				});
			}

			if (!failedToUpdateSelf.hasErrors()) {
				if (body.username) stuffToUpdate.username = Encryption.encrypt(body.username);

				if (body.tag) stuffToUpdate.tag = body.tag;
			}

		}

		if (body.globalNickname) stuffToUpdate.globalNickname = Encryption.encrypt(body.globalNickname);

		if (body.newPassword) {
			stuffToUpdate.password = await Bun.password.hash(body.newPassword);
		}

		if (failedToUpdateSelf.hasErrors()) {
			set.status = 400;

			return failedToUpdateSelf.toJSON();
		}

		if (body.bio) {
			await this.App.Cassandra.Models.Settings.update({
				userId: Encryption.encrypt(user.id),
				bio: Encryption.encrypt(body.bio)
			});
		}

		if (body.email) {
			stuffToUpdate.email = body.email;

			const foundUser = await this.fetchUser({
				email: Encryption.encrypt(body.email)
			}, ["email"]);

			if (foundUser.length > 0) {
				failedToUpdateSelf.addError({
					email: {
						code: "InvalidEmail",
						message: "The email provided was invalid, or already in use."
					}
				});
			} else {
				stuffToUpdate.email = Encryption.encrypt(body.email);

				user.flagsUtil.PrivateFlags.remove("EmailVerified");

				stuffToUpdate.flags = String(user.flagsUtil.PrivateFlags.bits);
			}
		}

		if (body.phoneNumber) {
			stuffToUpdate.phoneNumber = Encryption.encrypt(body.phoneNumber);
		}


		await this.App.Cassandra.Models.User.update({
			userId: Encryption.encrypt(user.id),
			...stuffToUpdate
		});

		// @ts-expect-error -- We dont need to add the other stuff (since its not being used anyways)
		return this.getFetch({
			user,
			query: body.bio ? { include: "bio" } : {},
			set
		});
	}

	private async fetchUser(opts: {
		email?: string,
		userId?: string;
		username?: string;
	}, fields: string[]) {
		// eslint-disable-next-line unicorn/no-array-method-this-argument
		const fetched = await this.App.Cassandra.Models.User.find(opts, {
			fields: fields as any // ? Due to me changing something string[] won't work anymore, but this should be safe 
		});

		return Encryption.completeDecryption(fetched.toArray().map((usr) => ({
			...usr,
			flags: usr.flags ? String(usr.flags) : "0",
			publicFlags: usr.flags ? String(usr.publicFlags) : "0"
		})));
	}
}
