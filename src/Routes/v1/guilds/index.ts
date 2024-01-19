import Constants from "@/Constants.ts";
import bodyValidator from "@/Middleware/BodyValidator.ts";
import type { UserMiddlewareType } from "@/Middleware/User.ts";
import userMiddleware from "@/Middleware/User.ts";
import type { Infer } from "@/Types/BodyValidation.ts";
import { array, boolean, enums, number, object, snowflake, string } from "@/Types/BodyValidation.ts";
import App from "@/Utils/Classes/App.ts";
import type FlagFields from "@/Utils/Classes/BitFields/Flags.ts";
import errorGen from "@/Utils/Classes/ErrorGen.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Middleware from "@/Utils/Classes/Routing/Decorators/Middleware.ts";
import type { CreateRoute } from "@/Utils/Classes/Routing/Route.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";
import type Roles from "@/Utils/Cql/Types/Role.ts";
import type { Channel, GuildMember } from "@/Utils/Cql/Types/index.ts";

const postGuild = {
	name: string().max(Constants.settings.Max.GuildNameLength),
	description: string().max(Constants.settings.Max.GuildDescriptionLength).optional().nullable(),
	channels: array({
		id: snowflake().optional(),
		name: string().max(32),
		description: string().max(256).optional().nullable(),
		// type: number(),
		type: enums(Object.values(Constants.channelTypes)),
		parentId: snowflake().optional().nullable(),
		permissionOverrides: object(
			{
				type: number(),
				allow: string().optional(),
				deny: string().optional(),
				// TODO: other stuff
			},
			"keyof",
		).optional(),
	})
		.optional()
		.max(Constants.settings.Max.ChannelCount),
	roles: array({
		id: snowflake().optional(),
		name: string().max(32),
		color: number().min(0).max(16_777_215),
		permissions: string(),
		hoist: boolean().optional(),
		position: number().min(0).max(100),
	})
		.optional()
		.max(Constants.settings.Max.RoleCount),
	template: string().optional(), // TODO: Create template stuff (basically like discords)
	features: enums(
		Object.values(Constants.guildFeatures)
			.filter((flag) => flag.Settable)
			.map((flag) => flag.Name),
	).array(),
};

export default class FetchGuilds extends Route {
	public constructor(App: App) {
		super(App);
	}

	@Method("get")
	@Description("Fetch the guilds the current user is in")
	@ContentTypes("any")
	public getGuilds() {
		return {};
	}

	@Method("post")
	@Description("Create a new guild")
	@ContentTypes("application/json")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: "User",
		}),
	)
	@Middleware(bodyValidator(postGuild))
	public postGuild({ body, user }: CreateRoute<"/guilds", Infer<typeof postGuild>, [UserMiddlewareType]>) {
		const canCreate = this.canCreateGuild(user.flagsUtil, user.guilds.length);

		if (!canCreate.can) {
			const maxGuild = errorGen.LimitReached();

			maxGuild.addError({
				guild: {
					code: "MaxGuildsReached",
					message: `You've created the max amount of guilds, you can only create ${canCreate.max} guilds.`,
				},
			});

			return maxGuild.toJSON();
		}

		const channels: Channel[] = [];
		const roles: Roles[] = [];
		const members: GuildMember[] = [];
		const newChannels: {
			description?: string | null;
			id?: string;
			name: string;
			oldId?: string | null;
			oldParentId?: string | null;
			parentId?: string | null;
			type: number;
		}[] = [];

		if (body.roles) {
			// ? Like body.channels, we shouldn't trust the clients ids, they are only used for channels permission overrides
		}

		if (body.channels) {
			// ? We sort the channels where, any channel with the type of "Category (App.Constants.channelTypes.GuildCategory)" is first
			// ? We then sort by the channels that have "parentId" then anything else goes through
			const sortedChannels = body.channels.sort((a, b) => {
				if (a.type === Constants.channelTypes.GuildCategory) {
					return -1;
				}

				if (b.type === Constants.channelTypes.GuildCategory) {
					return 1;
				}

				if (a.parentId && !b.parentId) {
					return -1;
				}

				if (b.parentId && !a.parentId) {
					return 1;
				}

				return 0;
			});

			for (const channel of sortedChannels) {
				if (channel.id && newChannels.some((c) => c.oldId === channel.id)) continue;

				// ? We generate a new channel id, since we do not trust the client
				// ? The clients ids though are used categories so clients can build a guild on the initial creation instead of after its created
				// ? Mainly doing this now, so I do not have to make the template system yet (since the client would in theory use that for the default guild)
				const newId = App.Snowflake.Generate();

				// ? For now we strip the parent id, maybe in the future we can send a error (idk if we should though, stripping it silently makes more sense)
				if (channel.type === Constants.channelTypes.GuildCategory && channel.parentId) {
					channel.parentId = null;
				}

				const foundParent =
					newChannels.find((c) => c.oldId === channel.parentId) ??
					sortedChannels.find((c) => c.id === channel.parentId);

				newChannels.push({
					name: channel.name,
					type: channel.type,
					description: channel.description ?? null,
					id: newId,
					oldId: channel.id ?? null,
					oldParentId: channel.parentId ?? null,
					parentId: foundParent ? foundParent.id ?? null : null,
				});
			}

			console.log(newChannels);
		}

		return body;
	}

	public canCreateGuild(flags: FlagFields, guildCount: number) {
		if (flags.has("IncreasedGuildCount100") && guildCount < 100) {
			return {
				can: true,
				max: 100,
			};
		}

		if (flags.has("IncreasedGuildCount200") && guildCount < 200) {
			return {
				can: true,
				max: 200,
			};
		}

		if (flags.has("IncreasedGuildCount500") && guildCount < 500) {
			return {
				can: true,
				max: 500,
			};
		}

		if (
			!flags.has("IncreasedGuildCount100") ||
			!flags.has("IncreasedGuildCount200") ||
			(!flags.has("IncreasedGuildCount500") && guildCount < Constants.settings.Max.GuildCount)
		) {
			return {
				can: true,
				max: Constants.settings.Max.GuildCount,
			};
		}

		return {
			can: false,
			max: flags.has("IncreasedGuildCount100")
				? 100
				: flags.has("IncreasedGuildCount200")
					? 200
					: flags.has("IncreasedGuildCount500")
						? 500
						: Constants.settings.Max.GuildCount,
		};
	}
}
