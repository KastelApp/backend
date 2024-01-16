import type { UserMiddlewareType } from "@/Middleware/User.ts";
import userMiddleware from "@/Middleware/User.ts";
import type App from "@/Utils/Classes/App.ts";
import Encryption from "@/Utils/Classes/Encryption.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Middleware from "@/Utils/Classes/Routing/Decorators/Middleware.ts";
import type { CreateRoute } from "@/Utils/Classes/Routing/Route.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";

export default class Sessions extends Route {
	public constructor(App: App) {
		super(App);
	}

	@Method("get")
	@Description("Fetch the current sessions")
	@ContentTypes("any")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: "User",
		}),
	)
	public async getSessions({ user }: CreateRoute<"/@me/sessions", any, [UserMiddlewareType]>) {
		const fetchedSessions = await this.App.Cassandra.Models.Settings.get(
			{
				userId: Encryption.encrypt(user.id),
			},
			{
				fields: ["user_id", "tokens"],
			},
		);

		if (!fetchedSessions) {
			return [];
		}

		return fetchedSessions.tokens.map((token) => ({
			id: Encryption.decrypt(token.tokenId),
			createdAt: token.createdDate.toISOString(),
			flags: token.flags,
			location: "Unknown",
			platform: "Unknown",
		}));
	}

	@Method("delete")
	@Description("Delete an existing session")
	@ContentTypes("application/json")
	public deleteSessions() {
		return {};
	}
}
