import type { UserMiddlewareType } from "@/Middleware/User.ts";
import userMiddleware from "@/Middleware/User.ts";
import type { Infer } from "@/Types/BodyValidation.ts";
import { array, boolean, number, snowflake, string } from "@/Types/BodyValidation.ts";
import type App from "@/Utils/Classes/App.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Middleware from "@/Utils/Classes/Routing/Decorators/Middleware.ts";
import type { CreateRoute } from "@/Utils/Classes/Routing/Route.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";
import Constants from "@/Constants.ts";

const postGuild = {
	name: string().max(100),
	description: string().max(256).optional().nullable(),
	channels: array({
		id: snowflake().optional(),
		name: string().max(32),
		description: string().max(256).optional().nullable(),
		type: number(),
		parentId: snowflake().optional().nullable(),
	})
		.optional()
		.max(Constants.settings.Max.ChannelCount),
	roles: array({
		id: snowflake().optional(),
		name: string().max(32),
		color: number().min(0).max(16_777_215),
		permissions: number(),
		hoist: boolean().optional(),
		position: number().min(0).max(100),
	})
		.optional()
		.max(Constants.settings.Max.RoleCount),
	template: string().optional(), // TODO: Create template stuff (basically like discords)
};

export default class FetchGuilds extends Route {
	public constructor(App: App) {
		super(App);
	}

	@Method("get")
	@Description("Fetch the guilds the current user is in")
	@ContentTypes("any")
	public getGuilds() {
		return {};
	}

	@Method("post")
	@Description("Create a new guild")
	@ContentTypes("application/json")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: "User",
		}),
	)
	public postGuild({ body }: CreateRoute<"/guilds", Infer<typeof postGuild>, [UserMiddlewareType]>) {
		return body;
	}
}
