import type { UserMiddlewareType } from "@/Middleware/User.ts";
import userMiddleware from "@/Middleware/User.ts";
import type API from "@/Utils/Classes/API.ts";
import GuildMemberFlags from "@/Utils/Classes/BitFields/GuildMember.ts";
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
import FetchCreateMessages from "../../channels/[channelId]/messages/index.ts";
import type { finishedGuild, rawGuild } from "../index.ts";

// TODO: Emit when the guild is deleted

export default class FetchEditGuild extends Route {
	public constructor(App: API) {
		super(App);
	}

	@Method("get")
	@Description("Fetch a guild")
	@ContentTypes("any")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: "User",
		}),
	)
	public async getGuild({
		user,
		query,
		params,
		set,
	}: CreateRoute<"/guilds/:guildId", any, [UserMiddlewareType], any, { include: string; }>) {
		const include: ("channels" | "owners" | "roles")[] = query.include
			? (query.include.split(",") as ("channels" | "owners" | "roles")[])
			: [];

		if (!user.guilds.includes(params.guildId)) {
			const invalidGuild = errorGen.UnknownGuild();

			invalidGuild.addError({
				guildId: {
					code: "UnknownGuild",
					message: "The provided guild does not exist, or you do not have access to it.",
				},
			});

			set.status = 404;

			return invalidGuild.toJSON();
		}

		const fetchedGuild = await this.App.cassandra.models.Guild.get({
			guildId: Encryption.encrypt(params.guildId),
		});

		if (!fetchedGuild) {
			this.App.logger.warn(`Failed to fetch guild ${params.guildId} for user ${user.id}`);

			set.status = 500;

			return "Internal Server Error :(";
		}

		const rawChannels = include.includes("channels")
			? await this.App.cassandra.models.Channel.find({
				guildId: Encryption.encrypt(params.guildId),
			})
			: null;

		const rawRoles = include.includes("roles")
			? await this.App.cassandra.models.Role.find({
				guildId: Encryption.encrypt(params.guildId),
			})
			: null;

		const rawGuild: rawGuild = {
			guild: fetchedGuild,
			roles: rawRoles ? rawRoles.toArray() : [],
			channels: rawChannels
				? fixChannelPositionsWithoutNewChannel(rawChannels.toArray()).map((channel) => ({ channel, overrides: [] }))
				: [],
		};

		for (const channel of rawGuild.channels) {
			for (const perm of channel.channel.permissionOverrides ?? []) {
				const found = await this.App.cassandra.models.PermissionOverride.get({
					id: perm, // ? already encrypted
				});

				if (!found) {
					this.App.logger.warn(
						`Failed to fetch permission override ${perm} for channel ${channel.channel.channelId} in guild ${params.guildId}`,
					);

					continue;
				}

				channel.overrides.push(found);
			}

			if (!channel.overrides) channel.overrides = [];
		}

		const guild: Partial<finishedGuild> = {
			name: Encryption.decrypt(rawGuild.guild.name),
			description: rawGuild.guild.description ? Encryption.decrypt(rawGuild.guild.description) : null,
			id: Encryption.decrypt(rawGuild.guild.guildId),
			features: rawGuild.guild.features,
			icon: rawGuild.guild.icon ? Encryption.decrypt(rawGuild.guild.icon) : null,
			flags: rawGuild.guild.flags,
			maxMembers: rawGuild.guild.maxMembers,
			channels: [],
			roles: [],
			coOwners: [],
		};

		if (include.includes("owners")) {
			const fetchedUser = await this.App.cassandra.models.User.get({
				userId: rawGuild.guild.ownerId,
			});

			if (fetchedUser) {
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
				guild.owner = null;

				this.App.logger.warn(
					`Failed to fetch owner ${Encryption.decrypt(rawGuild.guild.ownerId)} for guild ${Encryption.decrypt(rawGuild.guild.guildId)}`,
				);
			}
		} else {
			guild.ownerId = Encryption.decrypt(rawGuild.guild.ownerId);
		}

		const messageFetcher = new FetchCreateMessages(this.App);

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
				lastMessageId: await messageFetcher.getLastMessageId(Encryption.decrypt(channel.channel.channelId)),
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

		return guild;
	}

	@Method("post")
	@Description("Change this Description when working on this route")
	@ContentTypes("application/json")
	public postGuild() {
		return {};
	}

	@Method("delete")
	@Description("Delete a guild")
	@ContentTypes("any")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: "User",
		}),
	)
	public async deleteGuild({ user, params, set }: CreateRoute<"/:guildId", any, [UserMiddlewareType]>) {
		const noPermission = errorGen.MissingPermissions();
		const notFound = errorGen.UnknownGuild();

		if (!user.guilds.includes(params.guildId)) {
			notFound.addError({
				guildId: {
					code: "UnknownGuild",
					message: "The provided guild does not exist, or you do not have access to it.",
				},
			});

			set.status = 404;

			return notFound.toJSON();
		}

		const guildMember = (await this.App.cassandra.models.GuildMember.get({
			guildId: Encryption.encrypt(params.guildId),
			userId: Encryption.encrypt(user.id),
			left: false
		}))!;

		if (!guildMember) {
			set.status = 500;

			return "Internal Server Error :(";
		}

		const guildMemberFlags = new GuildMemberFlags(guildMember.flags);

		if (!guildMemberFlags.has("Owner")) {
			noPermission.addError({
				guildId: {
					code: "MissingPermissions",
					message: "You do not have permission to delete this guild.",
					requiredPermissions: [],
				},
			});

			set.status = 403;

			return noPermission.toJSON();
		}

		// ? why aren't we using the models here?
		await this.App.cassandra.execute("DELETE FROM channels WHERE guild_id = ?", [Encryption.encrypt(params.guildId)]);
		await this.App.cassandra.execute("DELETE FROM guild_members WHERE guild_id = ? AND left = false", [
			Encryption.encrypt(params.guildId),
		]);
		await this.App.cassandra.execute("DELETE FROM guild_members WHERE guild_id = ? AND left = true", [
			Encryption.encrypt(params.guildId),
		]);
		await this.App.cassandra.execute("DELETE FROM emojis WHERE guild_id = ?", [Encryption.encrypt(params.guildId)]);
		await this.App.cassandra.execute("DELETE FROM invites WHERE guild_id = ?", [Encryption.encrypt(params.guildId)]);
		await this.App.cassandra.execute("DELETE FROM roles WHERE guild_id = ?", [Encryption.encrypt(params.guildId)]);
		await this.App.cassandra.execute("DELETE FROM webhooks WHERE guild_id = ?", [Encryption.encrypt(params.guildId)]);
		await this.App.cassandra.execute("DELETE FROM bans WHERE guild_id = ?", [Encryption.encrypt(params.guildId)]);
		await this.App.cassandra.execute("DELETE FROM guilds WHERE guild_id = ?", [Encryption.encrypt(params.guildId)]);

		await this.App.cassandra.models.User.update({
			userId: Encryption.encrypt(user.id),
			guilds: Encryption.completeEncryption(user.guilds.filter((guild) => guild !== params.guildId)),
		});

		set.status = 204;

		this.App.rabbitMQForwarder("guild.delete", {
			guildId: params.guildId,
		});

		// eslint-disable-next-line sonarjs/no-redundant-jump, no-useless-return
		return;
	}
}
