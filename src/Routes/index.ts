import type App from "@/Utils/Classes/App.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";

export default class Index extends Route {
	public constructor(App: App) {
		super(App);
	}

	@Method("get")
	@Description("Get the features of the API")
	@ContentTypes("application/json")
	public Request() {
		return {};
	}
}
