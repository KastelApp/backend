// import {
// 	allowedMentions,
// 	auditLogActions,
// 	channelTypes,
// 	guildFeatures,
// 	inviteFlags,
// 	messageFlags,
// 	permissionOverrideTypes,
// 	permissions,
// 	presenceTypes,
// 	publicFlags,
// 	statusTypes,
// 	relationshipFlags,
// 	privateFlags
// } from "@/Constants.ts"
import type API from "@/Utils/Classes/API.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";

export default class Index extends Route {
	public constructor(App: API) {
		super(App);
	}

	@Method("get")
	@Description("Get the features of the API")
	@ContentTypes("any")
	public Request() {
		const apiVersions = Object.keys(this.App.router.routes)
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

		return JSON.parse(this.App.jsonStringify({
			api: {
				versions: apiVersions,
				latest: apiVersions[apiVersions.length - 1] ?? 0,
			},
			features: this.App.config.server.features ?? [],
			// constants: { // ? NOTE: to any bot devs, do not rely on the API provided constants. Please hard code them into your library.
			// 	allowedMentions,
			// 	auditLogActions,
			// 	channelTypes,
			// 	guildFeatures: Object.values(guildFeatures).filter((feature) => feature.settable && !feature.deprecated).map((feature) => feature.name),
			// 	inviteFlags,
			// 	messageFlags,
			// 	permissionOverrideTypes,
			// 	permissions,
			// 	presenceTypes,
			// 	publicFlags,
			// 	relationshipFlags,
			// 	privateFlags: {
			// 		Spammer: privateFlags.Spammer,
			// 		VerifiedBot: privateFlags.VerifiedBot,
			// 		Bot: privateFlags.Bot,
			// 	},
			// 	statusTypes
			// }
		}));
	}
}
