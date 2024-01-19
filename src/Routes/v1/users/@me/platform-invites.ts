import type App from "@/Utils/Classes/App.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";

export default class PlatformInvites extends Route {
	public constructor(App: App) {
		super(App);
	}

	@Method("get")
	@Description("Fetch the invites for Kastel")
	@ContentTypes("any")
	public getInvites() {
		return [];
	}

	@Method("delete")
	@Description("Delete a invite")
	@ContentTypes("application/json")
	public deleteInvite() {
		return {};
	}

	@Method("post")
	@Description("Create a new invite for Kastel")
	@ContentTypes("application/json")
	public createInvite() {
		return {};
	}
}
