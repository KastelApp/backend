import bodyValidator from "@/Middleware/BodyValidator.ts";
import type { UserMiddlewareType } from "@/Middleware/User.ts";
import userMiddleware from "@/Middleware/User.ts";
import type { Infer } from "@/Types/BodyValidation.ts";
import { any, boolean, number, string } from "@/Types/BodyValidation.ts";
import type API from "@/Utils/Classes/API.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Middleware from "@/Utils/Classes/Routing/Decorators/Middleware.ts";
import type { CreateRoute } from "@/Utils/Classes/Routing/Route.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";

const createRoleBody = {
	name: string().max(32),
	color: number().min(0).max(16_777_215).optional(),
	permissions: any().optional(),
	hoist: boolean().optional(),
	position: number().min(0).max(100),
	allowedAgeRestricted: boolean().optional(),
} 

export default class FetchCreateRoles extends Route {
	public constructor(App: API) {
		super(App);
	}

	@Method("get")
	@Description("Get all the roles in a guild")
	@ContentTypes("any")
	public getRoles() {
		return {};
	}

	@Method("post")
	@Description("Create a brand new role")
	@ContentTypes("application/json")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: "User",
		}),
	)
	@Middleware(bodyValidator(createRoleBody))
	public postRoles({ body, user, params }: CreateRoute<"/:guildId/roles", Infer<typeof createRoleBody>, [UserMiddlewareType]>) {
		return {};
	}
}
