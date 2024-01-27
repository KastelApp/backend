import type API from "@/Utils/Classes/API.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";

export default class ResetPassword extends Route {
	public constructor(App: API) {
		super(App);
	}

	@Method("patch")
	@Description("Change this Description when working on this route")
	@ContentTypes("application/json")
	public patchReset() {
		return {};
	}
}
