import type App from "@/Utils/Classes/App.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";

export default class Register extends Route {
	public constructor(App: App) {
		super(App);
	}

	@Method("post")
	@Description("Change this Description when working on this route")
	@ContentTypes("application/json")
	public postRegister() {
		return {};
	}
}
