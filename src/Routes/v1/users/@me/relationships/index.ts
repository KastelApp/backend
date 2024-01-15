import type App from "@/Utils/Classes/App.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";

export default class UserSettings extends Route {
	public constructor(App: App) {
		super(App);
	}

	@Method("get")
	@Description("Get your relationships")
	@ContentTypes("any")
	public getRelationships() {
		return {};
	}
    
    @Method("post")
	@Description("Create a new relationship")
	@ContentTypes("application/json")
	public postRelationships() {
		return {};
	}
}
