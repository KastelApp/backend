import bodyValidator from "@/Middleware/BodyValidator.ts";
import type { UserMiddlewareType } from "@/Middleware/User.ts";
import userMiddleware from "@/Middleware/User.ts";
import type { Infer } from "@/Types/BodyValidation.ts";
import { array, number, snowflake, string } from "@/Types/BodyValidation.ts";
import type API from "@/Utils/Classes/API.ts";
import Encryption from "@/Utils/Classes/Encryption.ts";
import errorGen from "@/Utils/Classes/ErrorGen.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Middleware from "@/Utils/Classes/Routing/Decorators/Middleware.ts";
import type { CreateRoute } from "@/Utils/Classes/Routing/Route.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";

const patchSettings = {
	customStatus: string().optional().nullable().max(128),
	theme: string().optional().max(5).min(4), // dark, light, auto
	language: string().optional().max(5).min(2), // en-US
	guildOrder: array({
		guildId: snowflake(),
		position: number().min(0).max(100),
	})
		.max(100)
		.optional(),
	bio: string().optional().max(300),
};

export default class UserSettings extends Route {
	public constructor(App: API) {
		super(App);
	}

	@Method("get")
	@Description("Fetch the current users settings")
	@ContentTypes("any")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: "User",
		}),
	)
	public async getSettings({ user }: CreateRoute<"/@me/settings", {}, [UserMiddlewareType]>) {
		return user.settings;
	}

	public themes = ["dark", "light", "auto"];

	public supportedLanugages = ["en-US"];

	@Method("patch")
	@Description("Update the current users settings")
	@ContentTypes("application/json")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: "User",
		}),
	)
	@Middleware(bodyValidator(patchSettings))
	public async patchSettings({
		user,
		body,
	}: CreateRoute<"/@me/settings", Infer<typeof patchSettings>, [UserMiddlewareType]>) {
		const failedToUpdateSettigns = errorGen.FailedToPatchUser();

		const data: Partial<Infer<typeof patchSettings>> = {};

		if (body.theme) {
			if (!this.themes.includes(body.theme)) {
				failedToUpdateSettigns.addError({
					theme: {
						code: "InvalidTheme",
						message: `The theme you provided was invalid, a valid theme is "${this.themes.join('", "')}"`,
					},
				});
			}

			data.theme = body.theme;
		}

		if (body.language) {
			if (!this.supportedLanugages.includes(body.language)) {
				failedToUpdateSettigns.addError({
					language: {
						code: "InvalidLanguage",
						message: `The language you provided was invalid, a valid language is "${this.supportedLanugages.join(
							'", "',
						)}"`,
					},
				});
			}

			data.language = body.language;
		}

		if (body.customStatus) {
			data.customStatus = Encryption.encrypt(body.customStatus);
		}

		if (body.bio) {
			data.bio = Encryption.encrypt(body.bio);
		}

		const fixedGuilds = body.guildOrder;

		if (fixedGuilds) {
			for (const guild of fixedGuilds) {
				if (!user.guilds.includes(guild.guildId)) {
					failedToUpdateSettigns.addError({
						[`guildOrder.${guild.guildId}`]: {
							code: "InvalidGuild",
							message: "The guild you provided was invalid, you are not in that guild",
						},
					});
				}
			}

			// TODO: fix the guild positions i.e if the user sends 0, 3, 8 fix it to 0, 1, 2
			// TODO: and if theres any duplicates set them to the next position then push the rest back
		}

		if (failedToUpdateSettigns.hasErrors()) {
			return failedToUpdateSettigns;
		}

		await this.App.cassandra.models.Settings.update({
			userId: Encryption.encrypt(user.id),
			...data,
		});

		return {
			bio: body.bio ?? user.settings.bio,
			guildOrder: fixedGuilds ?? user.settings.guildOrder,
			language: body.language ?? user.settings.language,
			privacy: user.settings.privacy,
			customStatus: body.customStatus ?? user.settings.customStatus,
			theme: body.theme ?? user.settings.theme,
		};
	}
}
