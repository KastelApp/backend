import type { UserMiddlewareType } from "@/Middleware/User.ts";
import userMiddleware from "@/Middleware/User.ts";
import type App from "@/Utils/Classes/App.ts";
import Encryption from "@/Utils/Classes/Encryption.ts";
import errorGen from "@/Utils/Classes/ErrorGen.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Middleware from "@/Utils/Classes/Routing/Decorators/Middleware.ts";
import type { CreateRoute } from "@/Utils/Classes/Routing/Route.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";

// ? Why would we want to have a "profile" route instead of adding it to the normal user route
// ? Great question, the reason is I want it to be the same as the @me route, since the profile meta data is sent in the
// ? Gateway payload for identify, I want to keep it the same as the @me route, so that way I can easily document it

interface ProfileResponse {
	connections: unknown[]; // TODO: Add connections (Discord, Twitter (X), Github, Steam, Spotify (Not sure if we can do this one), Reddit, Youtube, Twitch)
	mutualFriends: string[];
	mutualGuilds: string[];
}

export default class Profile extends Route {
	public constructor(App: App) {
		super(App);
	}

	@Method("get")
	@Description("Fetch a users profile")
	@ContentTypes("any")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: ["User"],
		}),
	)
	public async getProfile({ params, set, user }: CreateRoute<"/users/:userId/profile", any, [UserMiddlewareType]>) {
		const fetchedUser = await this.App.Cassandra.Models.User.get({
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

		const mutualGuilds = user.guilds.filter((guild) => fetchedUser.guilds.includes(Encryption.encrypt(guild)));

		const response: ProfileResponse = {
			connections: [],
			mutualFriends: [],
			mutualGuilds,
		};

		return response;
	}
}
