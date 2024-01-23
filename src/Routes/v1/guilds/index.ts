import bodyValidator from "@/Middleware/BodyValidator.ts";
import type { UserMiddlewareType } from "@/Middleware/User.ts";
import userMiddleware from "@/Middleware/User.ts";
import type { Infer } from "@/Types/BodyValidation.ts";
import { any, array, boolean, enums, number, object, snowflake, string } from "@/Types/BodyValidation.ts";
import type API from "@/Utils/Classes/API.ts";
import type FlagFields from "@/Utils/Classes/BitFields/Flags.ts";
import Permissions from "@/Utils/Classes/BitFields/Permissions.ts";
import Encryption from "@/Utils/Classes/Encryption.ts";
import errorGen from "@/Utils/Classes/ErrorGen.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Middleware from "@/Utils/Classes/Routing/Decorators/Middleware.ts";
import type { CreateRoute } from "@/Utils/Classes/Routing/Route.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";
import { fixChannelPositionsWithoutNewChannel } from "@/Utils/Versioning/v1/FixChannelPositions.ts";
import Constants from "@/Constants.ts";
import type { bigintPair } from "@/Utils/Cql/Types/PermissionsOverides.ts";
import type Roles from "@/Utils/Cql/Types/Role.ts";
import type { Channel, Guild, GuildMember, PermissionOverride } from "@/Utils/Cql/Types/index.ts";

const permissionOverrideType = (value: any): value is [[string, string]] => {
	return (
		Array.isArray(value) &&
		value.every((v) => Array.isArray(v) && v.length === 2 && typeof v[0] === "string" && typeof v[1] === "string")
	);
};

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
				type: enums(Object.values(Constants.permissionOverrideTypes)),
				allow: any().optional().nullable(),
				deny: any().optional().nullable(),
				slowmode: number().min(0).max(86_400).optional(), // ? In seconds
				// TODO: other stuff
			},
			"keyof",
		).optional(),
		slowmode: number().min(0).max(86_400).optional(), // ? In seconds
		ageRestricted: boolean().optional(),
		position: number().optional(),
	})
		.optional()
		.max(Constants.settings.Max.ChannelCount),
	roles: array({
		id: snowflake().optional(),
		name: string().max(32),
		color: number().min(0).max(16_777_215).optional(),
		permissions: any().optional(),
		hoist: boolean().optional(),
		position: number().min(0).max(100),
		everyone: boolean().optional(), // ? If the role is the @everyone role (default)
		allowedAgeRestricted: boolean().optional(),
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

interface finishedGuild {
	channels: {
		ageRestricted: boolean;
		children: string[];
		description: string | null;
		id: string;
		name: string;
		parentId: string | null;
		permissionOverrides: {
			[id: string]: {
				allow: [string, string][];
				deny: [string, string][];
				slowmode: number;
				type: number;
			};
		};
		position: number;
		slowmode: number;
		type: number;
	}[];
	coOwners: string[];
	description: string | null;
	features: string[];
	flags: number;
	icon: string | null;
	maxMembers: number;
	name: string;
	owner?: {
		avatar: string | null;
		flags: string;
		globalNickname: string | null;
		id: string;
		publicFlags: string;
		tag: string;
		username: string;
	} | null;
	ownerId?: string;
	roles: {
		allowedAgeRestricted: boolean;
		color: number;
		hoist: boolean;
		id: string;
		name: string;
		permissions: [string, string][];
		position: number;
	}[];
}

export default class FetchGuilds extends Route {
	public constructor(App: API) {
		super(App);
	}

	@Method("get")
	@Description("Fetch the guilds the current user is in")
	@ContentTypes("any")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: "User",
		}),
	)
	public async getGuilds({ user, query }: CreateRoute<"/guilds", any, [UserMiddlewareType], any, { include: string }>) {
		interface rawGuild {
			channels: {
				channel: Channel;
				overrides: PermissionOverride[];
			}[];
			guild: Guild;
			roles: Roles[];
		}

		const rawFinishedGuild: rawGuild[] = [];
		const invalidGuildIds: string[] = [];
		const include: ("channels" | "owners" | "roles")[] = query.include
			? (query.include.split(",") as ("channels" | "owners" | "roles")[])
			: [];

		for (const guild of user.guilds) {
			const fetchedGuild = await this.App.cassandra.Models.Guild.get({
				guildId: Encryption.encrypt(guild),
			});

			if (!fetchedGuild) {
				this.App.logger.warn(`Failed to fetch guild ${guild} for user ${user.id}`);

				invalidGuildIds.push(guild);

				continue;
			}

			const rawChannels = include.includes("channels")
				? await this.App.cassandra.Models.Channel.find({
						guildId: Encryption.encrypt(guild),
					})
				: null;

			const rawRoles = include.includes("roles")
				? await this.App.cassandra.Models.Role.find({
						guildId: Encryption.encrypt(guild),
					})
				: null;

			const raw: rawGuild = {
				guild: fetchedGuild,
				roles: rawRoles ? rawRoles.toArray() : [],
				channels: rawChannels
					? fixChannelPositionsWithoutNewChannel(rawChannels.toArray()).map((channel) => ({ channel, overrides: [] }))
					: [],
			};

			for (const channel of raw.channels) {
				for (const perm of channel.channel.permissionOverrides ?? []) {
					const found = await this.App.cassandra.Models.PermissionOverride.get({
						id: perm, // ? already encrypted
					});

					if (!found) {
						this.App.logger.warn(
							`Failed to fetch permission override ${perm} for channel ${channel.channel.channelId} in guild ${guild}`,
						);

						continue;
					}

					channel.overrides.push(found);
				}

				if (!channel.overrides) channel.overrides = [];
			}

			rawFinishedGuild.push(raw);
		}

		for (const guild of invalidGuildIds) {
			const index = user.guilds.indexOf(guild);

			if (index !== -1) {
				user.guilds.splice(index, 1);
			}

			await this.App.cassandra.Models.User.update({
				userId: Encryption.encrypt(user.id),
				guilds: Encryption.completeEncryption(user.guilds),
			});
		}

		const guilds: finishedGuild[] = [];

		for (const rawGuild of rawFinishedGuild) {
			const guild: Partial<finishedGuild> = {
				name: Encryption.decrypt(rawGuild.guild.name),
				description: rawGuild.guild.description ? Encryption.decrypt(rawGuild.guild.description) : null,
				features: rawGuild.guild.features,
				icon: rawGuild.guild.icon ? Encryption.decrypt(rawGuild.guild.icon) : null,
				flags: rawGuild.guild.flags,
				maxMembers: rawGuild.guild.maxMembers,
				channels: [],
				roles: [],
				coOwners: [],
			};

			if (include.includes("owners")) {
				const fetchedUser = await this.App.cassandra.Models.User.get({
					userId: rawGuild.guild.ownerId,
				});

				if (!fetchedUser) {
					guild.owner = null;

					this.App.logger.warn(
						`Failed to fetch owner ${Encryption.decrypt(rawGuild.guild.ownerId)} for guild ${Encryption.decrypt(rawGuild.guild.guildId)}`,
					);

					continue;
				}

				guild.owner = {
					avatar: fetchedUser.avatar ? Encryption.decrypt(fetchedUser.avatar) : null,
					flags: fetchedUser.flags,
					globalNickname: fetchedUser.globalNickname ? Encryption.decrypt(fetchedUser.globalNickname) : null,
					id: Encryption.decrypt(fetchedUser.userId),
					publicFlags: fetchedUser.publicFlags,
					tag: fetchedUser.tag,
					username: Encryption.decrypt(fetchedUser.username),
				};
			} else {
				guild.ownerId = Encryption.decrypt(rawGuild.guild.ownerId);
			}

			for (const channel of rawGuild.channels) {
				guild.channels?.push({
					name: Encryption.decrypt(channel.channel.name),
					description: channel.channel.description ? Encryption.decrypt(channel.channel.description) : null,
					id: Encryption.decrypt(channel.channel.channelId),
					parentId: channel.channel.parentId ? Encryption.decrypt(channel.channel.parentId) : null,
					ageRestricted: channel.channel.ageRestricted,
					slowmode: channel.channel.slowmode,
					type: channel.channel.type,
					children: channel.channel.children ? Encryption.completeDecryption(channel.channel.children) : [],
					permissionOverrides: Object.fromEntries(
						channel.overrides.map((override) => {
							return [
								Encryption.decrypt(override.permissionId),
								{
									allow: Permissions.permissionFromBigint(override.allow).normizedBits,
									deny: Permissions.permissionFromBigint(override.deny).normizedBits,
									slowmode: override.slowmode,
									type: override.type,
								},
							];
						}),
					),
					position: channel.channel.position,
				});
			}

			for (const role of rawGuild.roles) {
				guild.roles?.push({
					name: Encryption.decrypt(role.name),
					color: role.color,
					hoist: role.hoisted,
					id: Encryption.decrypt(role.roleId),
					permissions: Permissions.permissionFromBigint(role.permissions).normizedBits,
					position: role.position,
					allowedAgeRestricted: role.allowedAgeRestricted,
				});
			}

			guilds.push(guild as finishedGuild);
		}

		return guilds;
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
	public async postGuild({ body, user }: CreateRoute<"/guilds", Infer<typeof postGuild>, [UserMiddlewareType]>) {
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

		const permissionOverrides: PermissionOverride[] = [];
		const channels: Channel[] = [];
		const roles: Roles[] = [];
		const members: GuildMember[] = [];
		const newChannels: {
			ageRestricted?: boolean;
			description?: string | null;
			id: string;
			name: string;
			oldId?: string | null;
			oldParentId?: string | null;
			parentId?: string | null;
			permissionsOverrides?: string[];
			position: number;
			slowmode: number;
			type: number;
		}[] = [];

		interface role {
			allowedAgeRestricted?: boolean;
			color: number;
			hoist: boolean;
			id?: string;
			name: string;
			oldId?: string | null;
			permissions: bigintPair[] | null;
			position: number;
		}

		const newRoles: role[] = [];
		const guildId = this.App.snowflake.Generate();

		if (body.roles) {
			// ? Like body.channels, we shouldn't trust the clients ids, they are only used for channels permission overrides
			for (const role of body.roles) {
				const rl: Partial<role> = {};

				if (role.permissions) {
					if (permissionOverrideType(role.permissions)) {
						rl.permissions = new Permissions(role.permissions).bitsForDatabase;
					} else {
						rl.permissions = null;
					}
				}

				rl.color = role?.color ?? 0;
				rl.hoist = role?.hoist ?? false;
				rl.name = role?.name ?? "New Role";
				rl.position = role?.position ?? newRoles.length;
				rl.allowedAgeRestricted = role?.allowedAgeRestricted ?? false;

				if (role.everyone) {
					rl.id = guildId;
					rl.position = 0;
					rl.hoist = false;
					rl.color = 0;
				} else {
					rl.id = this.App.snowflake.Generate();
				}

				rl.oldId = role.id ?? null;

				newRoles.push(rl as role);
			}
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
				const newId = this.App.snowflake.Generate();

				// ? For now we strip the parent id, maybe in the future we can send a error (idk if we should though, stripping it silently makes more sense)
				if (channel.type === Constants.channelTypes.GuildCategory && channel.parentId) {
					channel.parentId = null;
				}

				const foundParent =
					newChannels.find((c) => c.oldId === channel.parentId) ??
					sortedChannels.find((c) => c.id === channel.parentId);

				const perms: string[] = [];

				if (channel.permissionOverrides) {
					for (const [id, permission] of Object.entries(channel.permissionOverrides)) {
						if (permission.type === Constants.permissionOverrideTypes.Role) {
							const foundRole = newRoles.find((r) => r.oldId === id);

							if (!foundRole) continue; // silently ignore it
							if (permission.allow && !permissionOverrideType(permission.allow)) continue; // silently ignore it
							if (permission.deny && !permissionOverrideType(permission.deny)) continue; // silently ignore it

							const permId = this.App.snowflake.Generate();

							permissionOverrides.push({
								allow: new Permissions(permission.allow ?? []).bitsForDatabase,
								deny: new Permissions(permission.deny ?? []).bitsForDatabase,
								editable: true,
								id: Encryption.encrypt(permId),
								permissionId: Encryption.encrypt(foundParent?.id ?? this.App.snowflake.Generate()),
								slowmode: permission.slowmode ?? 0,
								type: permission.type,
							});

							perms.push(permId);
						}
					}
				}

				newChannels.push({
					name: channel.name,
					type: channel.type,
					description: channel.description ?? null,
					id: newId,
					oldId: channel.id ?? null,
					oldParentId: channel.parentId ?? null,
					parentId: foundParent ? foundParent.id ?? null : null,
					slowmode: channel.slowmode ?? 0,
					ageRestricted: channel.ageRestricted ?? false,
					permissionsOverrides: perms,
					position: channel.position ?? newChannels.length,
				});
			}
		}

		for (const channel of newChannels) {
			channels.push({
				type: channel.type,
				channelId: Encryption.encrypt(channel.id),
				children: newChannels.filter((c) => c.parentId === channel.id).map((c) => c.id),
				description: channel.description ?? null,
				guildId: Encryption.encrypt(guildId),
				name: Encryption.encrypt(channel.name),
				ageRestricted: channel.ageRestricted ?? false,
				parentId: channel.parentId ? Encryption.encrypt(channel.parentId) : null,
				slowmode: channel.slowmode ?? 0,
				permissionOverrides: channel.permissionsOverrides
					? Encryption.completeEncryption(channel.permissionsOverrides)
					: [],
				allowedMentions: 0,
				position: newChannels.findIndex((c) => c.id === channel.id),
			});
		}

		for (const role of newRoles) {
			roles.push({
				color: role.color,
				guildId: Encryption.encrypt(guildId),
				hoisted: role.hoist,
				name: Encryption.encrypt(role.name),
				permissions: role.permissions ?? [],
				position: role.position,
				allowedAgeRestricted: role.allowedAgeRestricted ?? false,
				deleteable: role.id !== guildId,
				mentionable: true,
				roleId: Encryption.encrypt(role.id ?? this.App.snowflake.Generate()),
			});
		}

		const guild: Guild = {
			name: Encryption.encrypt(body.name),
			description: body.description ? Encryption.encrypt(body.description) : null,
			features: body.features ?? [],
			flags: 0,
			icon: null,
			guildId: Encryption.encrypt(guildId),
			coOwners: [],
			ownerId: Encryption.encrypt(user.id),
			maxMembers: Constants.settings.Max.MemberCount,
		};

		members.push({
			flags: Constants.guildMemberFlags.Owner | Constants.guildMemberFlags.In,
			guildId: Encryption.encrypt(guildId),
			joinedAt: new Date(),
			nickname: null,
			roles: [Encryption.encrypt(guildId)],
			timeouts: [],
			userId: Encryption.encrypt(user.id),
		});

		const fixedChannels = fixChannelPositionsWithoutNewChannel(channels);

		await Promise.all([
			fixedChannels.map((channel) => void this.App.cassandra.Models.Channel.insert(channel)),
			roles.map((role) => void this.App.cassandra.Models.Role.insert(role)),
			permissionOverrides.map(
				(permissionOverride) => void this.App.cassandra.Models.PermissionOverride.insert(permissionOverride),
			),
			members.map((member) => void this.App.cassandra.Models.GuildMember.insert(member)),
			this.App.cassandra.Models.Guild.insert(guild),
			this.App.cassandra.Models.User.update({
				userId: Encryption.encrypt(user.id),
				guilds: [...Encryption.completeEncryption(user.guilds), Encryption.encrypt(guildId)],
			}),
		]);

		return Encryption.completeDecryption({
			name: body.name,
			description: body.description ?? null,
			features: body.features ?? [],
			icon: null,
			id: guildId,
			ownerId: user.id,
			coOwners: [],
			maxMembers: Constants.settings.Max.MemberCount,
			flags: 0,
			channels: channels.map((channel) => ({
				id: channel.channelId,
				name: channel.name,
				description: channel.description ?? null,
				type: channel.type,
				parentId: channel.parentId ?? null,
				permissionOverrides: Object.fromEntries(
					channel.permissionOverrides.map((id) => {
						const found = permissionOverrides.find((p) => p.id === id);

						if (!found) return [];

						return [
							Encryption.decrypt(found.permissionId),
							{
								allow: Permissions.permissionFromBigint(found.allow).normizedBits,
								deny: Permissions.permissionFromBigint(found.deny).normizedBits,
								slowmode: found.slowmode,
								type: found.type,
							},
						];
					}),
				),
				slowmode: channel.slowmode ?? 0,
				ageRestricted: channel.ageRestricted ?? false,
				children: channels.filter((c) => c.parentId === channel.channelId).map((c) => c.channelId),
				position: channel.position,
			})),
			roles: roles.map((role) => ({
				id: role.roleId,
				name: role.name,
				color: role.color,
				hoist: role.hoisted,
				position: role.position,
				permissions: Permissions.permissionFromBigint(role.permissions).normizedBits,
				allowedAgeRestricted: role.allowedAgeRestricted ?? false,
			})),
		});
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
			(!flags.has("IncreasedGuildCount100") ||
				!flags.has("IncreasedGuildCount200") ||
				!flags.has("IncreasedGuildCount500")) &&
			guildCount < Constants.settings.Max.GuildCount
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
