import type { UserMiddlewareType } from "@/Middleware/User.ts";
import userMiddleware from "@/Middleware/User.ts";
import type API from "@/Utils/Classes/API.ts";
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
	flags: string;
	globalNickname: string | null;
	id: string;
	publicFlags: string;
	tag: string;
	username: string;
}

export default class Fetch extends Route {
	public constructor(App: API) {
		super(App);
	}

	@Method("get")
	@Description("Fetch a user by their ID")
	@ContentTypes("any")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: ["User"],
		}),
	)
	public async getProfile({ params, query, set }: CreateRoute<"/users/:userId", any, [UserMiddlewareType]>) {
		const fetchedUser = await this.App.cassandra.Models.User.get({
			userId: Encryption.encrypt(params.userId),
		});

		if (!fetchedUser) {
			const userNotFound = errorGen.InvalidUser();

			userNotFound.addError({
				user: {
					code: "InvalidUser",
					message: "The requested user does not exist, or they have blocked you.",
				},
			});

			set.status = 404;

			return userNotFound.toJSON();
		}

		const flags = new FlagFields(fetchedUser.flags, fetchedUser?.publicFlags ?? 0);

		const include = query.include?.split(",") ?? [];

		const userObject: User = {
			id: fetchedUser.userId,
			username: fetchedUser.username,
			globalNickname: fetchedUser.globalNickname,
			tag: fetchedUser.tag,
			avatar: fetchedUser.avatar,
			publicFlags: String(flags.PublicFlags.cleaned),
			flags: String(flags.PrivateFlags.cleaned),
		};

		if (include.includes("bio")) {
			const bio = await this.App.cassandra.Models.Settings.get(
				{
					userId: Encryption.encrypt(params.userId),
				},
				{
					fields: ["bio"],
				},
			);

			userObject.bio = bio?.bio ?? null;
		}

		return Encryption.completeDecryption(userObject);
	}
}
