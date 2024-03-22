import Constants from "@/Constants.ts";
import bodyValidator from "@/Middleware/BodyValidator.ts";
import type { UserMiddlewareType } from "@/Middleware/User.ts";
import userMiddleware from "@/Middleware/User.ts";
import type { Infer } from "@/Types/BodyValidation.ts";
import { number, snowflake } from "@/Types/BodyValidation.ts";
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
import type PermissionsOverrides from "@/Utils/Cql/Types/PermissionsOverides.ts";
import type Roles from "@/Utils/Cql/Types/Role.ts";
import inviteGenerator from "@/Utils/InviteGenerator.ts";
import PermissionHandler from "@/Utils/Versioning/v1/PermissionCheck.ts";

const createInviteBody = {
	maxUses: number().max(100_000).min(1).optional(),
	maxAge: number()
		.max(1_000 * 60 * 60 * 24 * 30)
		.min(0)
		.optional(), // 30 days
	channelId: snowflake(),
};

export default class FetchInvite extends Route {
	public constructor(App: API) {
		super(App);
	}

	@Method("get")
	@Description("Fetch invites from a guild")
	@ContentTypes("any")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: "User",
		}),
	)
	public async getInvites({ user, params, set }: CreateRoute<"/guilds/:guildId/invites", any, [UserMiddlewareType]>) {
		const guildMember = await this.App.cassandra.models.GuildMember.get({
			guildId: Encryption.encrypt(params.guildId)!,
			userId: Encryption.encrypt(user.id),
				left: false
			});

		const unknownGuild = errorGen.UnknownGuild();

		if (!guildMember) {
			unknownGuild.addError({
				guild: {
					code: "UnknownGuild",
					message: "The provided guild does not exist or you do not have access to it.",
				},
			});

			set.status = 404;

			return unknownGuild.toJSON();
		}

		const guildMemberFlags = new GuildMemberFlags(guildMember.flags);

		if (!guildMemberFlags.has("In")) {
			set.status = 404;

			unknownGuild.addError({
				guild: {
					code: "UnknownGuild",
					message: "The provided guild does not exist or you do not have access to it.",
				},
			});

			return unknownGuild.toJSON();
		}

		// eslint-disable-next-line @typescript-eslint/promise-function-async
		const roles = (
			await Promise.all(
				guildMember.roles.map(async (id) =>
					this.App.cassandra.models.Role.get({
						roleId: Encryption.encrypt(id),
						guildId: Encryption.encrypt(params.guildId),
					}),
				),
			)
		).filter(Boolean) as Roles[];

		const permissionCheck = new PermissionHandler(
			user.id,
			guildMember.flags,
			roles.map((role) => ({
				id: role.roleId,
				permissions: Permissions.permissionFromDatabase(role.permissions),
				position: role.position,
			})),
			[],
		);

		if (!permissionCheck.hasAnyRole(["ViewInvites"])) {
			set.status = 403;

			const missingPermission = errorGen.MissingPermissions();

			missingPermission.addError({
				permission: {
					code: "MissingPermissions",
					message: "You do not have permission to view invites in this guild.",
				},
			});

			return missingPermission.toJSON();
		}

		const invites = (
			await this.App.cassandra.models.Invite.find(
				{
					guildId: Encryption.encrypt(params.guildId),
				},
				{
					fields: ["code", "uses", "maxUses", "createdAt", "expires", "creatorId", "deleteable", "type"],
					limit: 1_000,
				},
			)
		).toArray();

		return invites.map((invite) => ({
			code: invite.code,
			uses: invite.uses,
			maxUses: invite.maxUses,
			createdAt: invite.createdAt,
			expires: invite.expires,
			creatorId: invite.creatorId,
			deleteable: invite.deleteable,
			channelId: invite.channelId,
			type: invite.type,
		}));
	}

	@Method("post")
	@Description("Create a new invite")
	@ContentTypes("application/json")
	@Middleware(bodyValidator(createInviteBody))
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: "User",
		}),
	)
	public async createInvite({
		user,
		body,
		params,
		set,
	}: CreateRoute<"/guilds/:guildId/invites", Infer<typeof createInviteBody>, [UserMiddlewareType]>) {
		const guildMember = await this.App.cassandra.models.GuildMember.get({
			guildId: Encryption.encrypt(params.guildId)!,
			userId: Encryption.encrypt(user.id),
				left: false
			});

		const unknownGuild = errorGen.UnknownGuild();

		if (!guildMember) {
			unknownGuild.addError({
				guild: {
					code: "UnknownGuild",
					message: "The provided guild does not exist or you do not have access to it.",
				},
			});

			set.status = 404;

			return unknownGuild.toJSON();
		}

		const guildMemberFlags = new GuildMemberFlags(guildMember.flags);

		if (!guildMemberFlags.has("In")) {
			set.status = 404;

			unknownGuild.addError({
				guild: {
					code: "UnknownGuild",
					message: "The provided guild does not exist or you do not have access to it.",
				},
			});

			return unknownGuild.toJSON();
		}

		const channel = await this.App.cassandra.models.Channel.get({
			channelId: Encryption.encrypt(body.channelId),
			guildId: Encryption.encrypt(params.guildId),
		});

		const unknownChannel = errorGen.UnknownChannel();

		if (!channel) {
			set.status = 404;

			unknownChannel.addError({
				channel: {
					code: "UnknownChannel",
					message: "The provided channel does not exist or you do not have access to it.",
				},
			});

			return unknownChannel.toJSON();
		}

		// eslint-disable-next-line @typescript-eslint/promise-function-async
		const permissionOverrides = channel.permissionOverrides
			? ((
					await Promise.all(
						channel.permissionOverrides.map(async (id) =>
							this.App.cassandra.models.PermissionOverride.get({ permissionId: Encryption.encrypt(id) }),
						),
					)
				).filter(Boolean) as PermissionsOverrides[])
			: [];
		// eslint-disable-next-line @typescript-eslint/promise-function-async
		const roles = (
			await Promise.all(
				guildMember.roles.map(async (id) =>
					this.App.cassandra.models.Role.get({ roleId: Encryption.encrypt(id), guildId: channel.guildId! }),
				),
			)
		).filter(Boolean) as Roles[];

		const permissionCheck = new PermissionHandler(
			user.id,
			guildMember.flags,
			roles.map((role) => ({
				id: role.roleId,
				permissions: Permissions.permissionFromDatabase(role.permissions),
				position: role.position,
			})),
			[
				{
					id: channel.channelId,
					overrides: permissionOverrides.map((override) => ({
						allow: Permissions.permissionFromDatabase(override.allow),
						deny: Permissions.permissionFromDatabase(override.deny),
						id: override.permissionId,
						type: override.type === Constants.permissionOverrideTypes.Member ? "Member" : "Role",
					})),
				},
			],
		);

		if (
			!permissionCheck.hasChannelPermission(Encryption.decrypt(channel.channelId), ["CreateInvite", "ViewChannels"])
		) {
			set.status = 403;

			const missingPermission = errorGen.MissingPermissions();

			missingPermission.addError({
				permission: {
					code: "MissingPermissions",
					message: "You do not have permission to create an invite in this channel.",
				},
			});

			return missingPermission.toJSON();
		}

		const invites = (
			await this.App.cassandra.models.Invite.find(
				{
					guildId: Encryption.encrypt(params.guildId),
					channelId: Encryption.encrypt(body.channelId),
				},
				{
					fields: ["code"],
					limit: 1_000,
				},
			)
		).toArray();

		const maxInvites = errorGen.LimitReached();

		if (invites.length >= Constants.settings.Max.InviteCount) {
			set.status = 403;

			maxInvites.addError({
				invite: {
					code: "LimitReached",
					message: `The maximum amount of invites for this channel has been reached (${Constants.settings.Max.InviteCount}).`,
				},
			});

			return maxInvites.toJSON();
		}

		const inviteCode = await this.generateInviteCode();

		if (!inviteCode) {
			// ? Shouldn't happen, but just in case
			set.status = 500;

			return "Internal server error :(";
		}

		await this.App.cassandra.models.Invite.insert({
			code: Encryption.encrypt(inviteCode),
			guildId: Encryption.encrypt(params.guildId),
			channelId: Encryption.encrypt(body.channelId),
			uses: 0,
			maxUses: body.maxUses ?? 0,
			createdAt: new Date(),
			creatorId: Encryption.encrypt(user.id),
			deleteable: true,
			expires: body.maxAge ? new Date(Date.now() + body.maxAge) : null,
			type: Constants.inviteFlags.Normal,
		});

		return {
			code: inviteCode,
			uses: 0,
			maxUses: body.maxUses ?? null,
			createdAt: new Date(),
			expires: body.maxAge ? new Date(Date.now() + body.maxAge) : null,
			creatorId: user.id,
			deleteable: true,
			type: Constants.inviteFlags.Normal,
		};
	}

	public async generateInviteCode(length = 0): Promise<string | null> {
		const code = inviteGenerator();

		const invite = await this.App.cassandra.models.Invite.get({ code: Encryption.encrypt(code) });

		if (invite) {
			if (length > 100) return null;

			return this.generateInviteCode(length + 1);
		}

		return code;
	}
}
