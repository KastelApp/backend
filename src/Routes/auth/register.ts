import bodyValidator from "@/Middleware/BodyValidator.ts";
import userMiddleware from "@/Middleware/User.ts";
import type { Infer } from "@/Types/BodyValidation.ts";
import { string } from "@/Types/BodyValidation.ts";
import type App from "@/Utils/Classes/App.ts";
import Encryption from "@/Utils/Classes/Encryption.ts";
import errorGen from "@/Utils/Classes/ErrorGen.ts";
import IpUtils from "@/Utils/Classes/IpUtils.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Middleware from "@/Utils/Classes/Routing/Decorators/Middleware.ts";
import type { CreateRoute } from "@/Utils/Classes/Routing/Route.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";
import Token from "@/Utils/Classes/Token.ts";
import type Settings from "@/Utils/Cql/Types/Settings.ts";
import type Users from "@/Utils/Cql/Types/User.ts";
import tagGenerator from "@/Utils/TagGenerator.ts";

const postRequestBody = {
	email: string().email(),
	password: string().min(4).max(72),
	username: string().min(3).max(32),
	invite: string().optional(),
	platformInvite: string().optional(),
};

export default class Register extends Route {
	public maxUsernames = 6_000; // You can create 9999 users with the same username, but on registration, it will be limited to 6000

	public constructor(App: App) {
		super(App);
	}

	@Method("post")
	@Description("Register a new account")
	@ContentTypes("application/json")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedOut",
			AllowedRequesters: "User",
		}),
	)
	@Middleware(bodyValidator(postRequestBody))
	public async postRegister({ body, set, request }: CreateRoute<"/", Infer<typeof postRequestBody>>) {
		const failed = errorGen.FailedToRegister();

		if (this.App.config.server.features.includes("InviteBasedRegistration") && !body.platformInvite) {
			failed.addError({
				platformInvite: {
					code: "MissingInvite",
					message: "This Kastel instance requires an invite to register.",
				},
			});

			set.status = 400;

			return failed.toJSON();
		}

		const foundUser = await this.fetchUser({ email: Encryption.encrypt(body.email) }, ["email"]);
		const foundPlatformInvite = body.platformInvite
			? await this.App.Cassandra.Models.PlatformInvite.get({ code: Encryption.encrypt(body.platformInvite) })
			: null;
		const foundUsers = await this.fetchUser({ username: Encryption.encrypt(body.username) }, ["tag"]);
		const tag = tagGenerator(foundUsers.map((usr) => usr.tag));

		if (
			(!foundPlatformInvite && this.App.config.server.features.includes("InviteBasedRegistration")) ||
			foundPlatformInvite?.usedById ||
			(foundPlatformInvite?.expiresAt?.getTime() ?? 0) < Date.now()
		) {
			failed.addError({
				platformInvite: {
					code: "InvalidInvite",
					message: "The platform invite provided was invalid.",
				},
			});

			set.status = 400;

			return failed.toJSON(); // ? This is the only place this happens, we don't want to leak if the email is already taken, or if that max usernames has been reached
		}

		if (foundUser.length > 0) {
			failed.addError({
				email: {
					code: "InvalidEmail",
					message: "The email provided was invalid, or already in use.",
				},
			});
		}

		if (!tag || foundUser.length >= this.maxUsernames) {
			failed.addError({
				username: {
					code: "MaxUsernames",
					message: `The maximum amount of users with the username ${body.username} has been reached :(`,
				},
			});
		}

		if (failed.hasErrors()) {
			set.status = 400;

			return failed.toJSON();
		}

		const userObject: Users = {
			avatar: null,
			email: Encryption.encrypt(body.email),
			flags: "0",
			globalNickname: null,
			guilds: [],
			ips: [],
			password: await Bun.password.hash(body.password),
			phoneNumber: null,
			publicFlags: "0",
			tag: tag as string, // ? not too sure why its not counted as a string
			twoFaSecret: null,
			userId: Encryption.encryptedSnowflake(),
			username: Encryption.encrypt(body.username),
		};

		const token = Token.generateToken(Encryption.decrypt(userObject.userId));

		const settignsObject: Settings = {
			bio: null,
			language: "en-US",
			maxFileUploadSize: this.App.Constants.settings.Max.MaxFileSize,
			maxGuilds: this.App.Constants.settings.Max.GuildCount,
			mentions: [],
			presence: this.App.Constants.presence.Online,
			privacy: 0,
			status: null,
			theme: "dark",
			tokens: [
				{
					createdDate: new Date(),
					flags: 0,
					ip: IpUtils.getIp(request, this.App.ElysiaApp.server) ?? "",
					token: Encryption.encrypt(token),
					tokenId: Encryption.encryptedSnowflake(),
				},
			],
			userId: userObject.userId,
			guildOrder: [],
			allowedInvites: 0, // ? You get 0 invites on creation
		};

		if (foundPlatformInvite) {
			await this.App.Cassandra.Models.PlatformInvite.update({
				code: Encryption.encrypt(body.platformInvite as string),
				usedById: userObject.userId,
				usedAt: new Date(),
			});
		}

		await Promise.all([
			this.App.Cassandra.Models.User.insert(userObject),
			this.App.Cassandra.Models.Settings.insert(settignsObject),
		]);

		return {
			token,
			user: {
				id: Encryption.decrypt(userObject.userId),
				email: Encryption.decrypt(userObject.email),
				username: Encryption.decrypt(userObject.username),
				tag: userObject.tag,
				publicFlags: userObject.publicFlags,
				flags: userObject.flags,
			},
		};
	}

	private async fetchUser(
		opts: {
			email?: string;
			username?: string;
		},
		fields: string[],
	) {
		// eslint-disable-next-line unicorn/no-array-method-this-argument
		const fetched = await this.App.Cassandra.Models.User.find(opts, {
			fields: fields as any, // ? Due to me changing something string[] won't work anymore, but this should be safe
		});

		return Encryption.completeDecryption(
			fetched.toArray().map((usr) => ({
				...usr,
				flags: usr.flags ? String(usr.flags) : "0",
				publicFlags: usr.flags ? String(usr.publicFlags) : "0",
			})),
		);
	}
}
