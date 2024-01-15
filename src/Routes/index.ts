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
	@ContentTypes("any")
	public Request() {
		const apiVersions = Object.keys(this.App.Router.routes)
			.map((route) => {
				const rr = route.split("/")[1]?.trim() ?? "NA";

				return rr.length > 0 ? rr : "NA";
			})
			.filter((route) => !["auth", "NA", "billing"].includes(route))
			.map((route) => Number.parseInt(route.replace("v", ""), 10))
			.filter((route) => !Number.isNaN(route))
			.sort((a, b) => a - b)
			.reduce<number[]>((acc, cur) => {
				if (acc.includes(cur)) {
					return acc;
				}

				return [...acc, cur];
			}, []);

		return {
			api: {
				versions: apiVersions,
				latest: apiVersions[apiVersions.length - 1] ?? 0,
			},
			features: this.App.Config.Server.Features ?? [],
		};
	}
}
