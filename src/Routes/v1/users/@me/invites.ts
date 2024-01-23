import type API from "@/Utils/Classes/API.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";

export default class Invites extends Route {
	public constructor(App: API) {
		super(App);
	}

	@Method("get")
	@Description("Fetch all the invites you've created (guilds)")
	@ContentTypes("application/json")
	public getInvites() {
		return {};
	}

	@Method("delete")
	@Description("Delete an existing invite from a guild")
	@ContentTypes("application/json")
	public deleteInvite() {
		return {};
	}
}
