import type API from "@/Utils/Classes/API.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";

export default class Channels extends Route {
	public constructor(App: API) {
		super(App);
	}

	@Method("delete")
	@Description("Change this Description when working on this route")
	@ContentTypes("application/json")
	public deleteChannel() {
		return {};
	}

	@Method("get")
	@Description("Change this Description when working on this route")
	@ContentTypes("application/json")
	public getChannel() {
		return {};
	}
}
