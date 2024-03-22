import Constants from "@/Constants.ts";
import bodyValidator from "@/Middleware/BodyValidator.ts";
import type { UserMiddlewareType } from "@/Middleware/User.ts";
import userMiddleware from "@/Middleware/User.ts";
import { array, string } from "@/Types/BodyValidation.ts";
import type API from "@/Utils/Classes/API.ts";
import GuildMemberFlags from "@/Utils/Classes/BitFields/GuildMember.ts";
import { FlagUtils } from "@/Utils/Classes/BitFields/NewFlags.ts";
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
import PermissionHandler from "@/Utils/Versioning/v1/PermissionCheck.ts";

const editMessageBody = {
	content: string().max(Constants.settings.Max.MessageLength).optional(),
	embeds: array({}).optional(),
};

export default class DeleteEditGetMessage extends Route {
	public constructor(App: API) {
		super(App);
	}

	@Method("delete")
	@Description("Change this Description when working on this route")
	@ContentTypes("any")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: "User",
		}),
	)
	public async deleteMessage({
		user,
		params,
		set,
	}: CreateRoute<"/channels/:channelId/messages/:messageId", any, [UserMiddlewareType]>) {
		const channel = await this.App.cassandra.models.Channel.get({
			channelId: Encryption.encrypt(params.channelId),
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

		const channelFlags = new FlagUtils(channel.type, Constants.channelTypes);

		if (channelFlags.hasOneArray(["Dm", "GroupChat"])) {
			const message = await this.tryMessage(params.channelId, params.messageId);

			if (!message) {
				set.status = 404;

				const unknownMessage = errorGen.UnknownMessage();

				unknownMessage.addError({
					message: {
						code: "UnknownMessage",
						message: "The provided message does not exist or you do not have access to it.",
					},
				});

				return unknownMessage.toJSON();
			}

			if (Encryption.decrypt(message.authorId) !== user.id) {
				set.status = 403;

				const missingPermission = errorGen.MissingPermissions();

				missingPermission.addError({
					message: {
						code: "MissingPermissions",
						message: "You cannot delete a message that you did not create.",
						requiredPermissions: [], // ? note: this is a testing field, may be removed later
					},
				});

				return missingPermission.toJSON();
			}

			await this.App.cassandra.models.Message.remove({
				channelId: Encryption.encrypt(params.channelId),
				messageId: params.messageId,
				bucket: message.bucket,
			});
		} else {
			const guildMember = await this.App.cassandra.models.GuildMember.get({
				guildId: channel.guildId!,
				userId: Encryption.encrypt(user.id),
				left: false
			});

			if (!guildMember) {
				unknownChannel.addError({
					channel: {
						code: "UnknownChannel",
						message: "The provided channel does not exist or you do not have access to it.",
					},
				});

				set.status = 404;

				return unknownChannel.toJSON();
			}

			const guildMemberFlags = new GuildMemberFlags(guildMember.flags);

			if (!guildMemberFlags.has("In")) {
				set.status = 404;

				unknownChannel.addError({
					channel: {
						code: "UnknownChannel",
						message: "The provided channel does not exist or you do not have access to it.",
					},
				});

				return unknownChannel.toJSON();
			}

			const message = await this.tryMessage(params.channelId, params.messageId);

			if (!message) {
				set.status = 404;

				const unknownMessage = errorGen.UnknownMessage();

				unknownMessage.addError({
					message: {
						code: "UnknownMessage",
						message: "The provided message does not exist or you do not have access to it.",
					},
				});

				return unknownMessage.toJSON();
			}

			if (Encryption.decrypt(message.authorId) === user.id) {
				await this.App.cassandra.models.Message.remove({
					channelId: Encryption.encrypt(params.channelId),
					messageId: params.messageId,
					bucket: message.bucket,
				});

				set.status = 204;

				return;
			}

			// eslint-disable-next-line @typescript-eslint/promise-function-async
			const permissionOverrides = channel.permissionOverrides
				? ((
						await Promise.all(
							channel.permissionOverrides.map(async (id) =>
								this.App.cassandra.models.PermissionOverride.get({ permissionId: id }),
							),
						)
					).filter(Boolean) as PermissionsOverrides[])
				: [];
			// eslint-disable-next-line @typescript-eslint/promise-function-async
			const roles = (
				await Promise.all(
					guildMember.roles.map(async (id) =>
						this.App.cassandra.models.Role.get({ roleId: id, guildId: channel.guildId! }),
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
				!permissionCheck.hasChannelPermission(Encryption.decrypt(channel.channelId), [
					"ManageMessages",
					"ViewMessageHistory",
				])
			) {
				set.status = 403;

				const missingPermission = errorGen.MissingPermissions();

				missingPermission.addError({
					channel: {
						code: "MissingPermissions",
						message: 'You are missing the "ManageMessages" and "ViewMessageHistory" permissions.',
						requiredPermissions: ["ManageMessages", "ViewMessageHistory"], // ? note: this is a testing field, may be removed later
					},
				});

				return missingPermission.toJSON();
			}

			await this.App.cassandra.models.Message.remove({
				channelId: Encryption.encrypt(params.channelId),
				messageId: params.messageId,
				bucket: message.bucket,
			});
		}

		set.status = 204;

		// eslint-disable-next-line sonarjs/no-redundant-jump, no-useless-return
		return;
	}

	@Method("patch")
	@Description("Change this Description when working on this route")
	@ContentTypes("application/json")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: "User",
		}),
	)
	@Middleware(bodyValidator(editMessageBody))
	public async patchMessage({
		user,
		params,
		set,
		body,
	}: CreateRoute<"/channels/:channelId/messages/:messageId", any, [UserMiddlewareType]>) {
		const channel = await this.App.cassandra.models.Channel.get({
			channelId: Encryption.encrypt(params.channelId),
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

		const channelFlags = new FlagUtils(channel.type, Constants.channelTypes);
		const message = await this.tryMessage(params.channelId, params.messageId);

		if (!message) {
			set.status = 404;

			const unknownMessage = errorGen.UnknownMessage();

			unknownMessage.addError({
				message: {
					code: "UnknownMessage",
					message: "The provided message does not exist or you do not have access to it.",
				},
			});

			return unknownMessage.toJSON();
		}

		if (channelFlags.hasOneArray(["Dm", "GroupChat"])) {
			if (Encryption.decrypt(message.authorId) !== user.id) {
				set.status = 403;

				const missingPermission = errorGen.MissingPermissions();

				missingPermission.addError({
					message: {
						code: "MissingPermissions",
						message: "You cannot edit a message that you did not create.",
						requiredPermissions: [], // ? note: this is a testing field, may be removed later
					},
				});

				return missingPermission.toJSON();
			}
		} else {
			const guildMember = await this.App.cassandra.models.GuildMember.get({
				guildId: channel.guildId!,
				userId: Encryption.encrypt(user.id),
				left: false
			});

			if (!guildMember) {
				unknownChannel.addError({
					channel: {
						code: "UnknownChannel",
						message: "The provided channel does not exist or you do not have access to it.",
					},
				});

				set.status = 404;

				return unknownChannel.toJSON();
			}

			const guildMemberFlags = new GuildMemberFlags(guildMember.flags);

			if (!guildMemberFlags.has("In")) {
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
								this.App.cassandra.models.PermissionOverride.get({ permissionId: id }),
							),
						)
					).filter(Boolean) as PermissionsOverrides[])
				: [];
			// eslint-disable-next-line @typescript-eslint/promise-function-async
			const roles = (
				await Promise.all(
					guildMember.roles.map(async (id) =>
						this.App.cassandra.models.Role.get({ roleId: id, guildId: channel.guildId! }),
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

			if (!permissionCheck.hasChannelPermission(Encryption.decrypt(channel.channelId), ["ViewMessageHistory"])) {
				set.status = 403;

				const missingPermission = errorGen.MissingPermissions();

				missingPermission.addError({
					channel: {
						code: "MissingPermissions",
						message: 'You are missing the "ViewMessageHistory" permission.',
						requiredPermissions: ["ViewMessageHistory"], // ? note: this is a testing field, may be removed later
					},
				});

				return missingPermission.toJSON();
			}

			if (Encryption.decrypt(message.authorId) !== user.id) {
				set.status = 403;

				const missingPermission = errorGen.MissingPermissions();

				missingPermission.addError({
					message: {
						code: "MissingPermissions",
						message: "You cannot edit a message that you did not create.",
						requiredPermissions: [], // ? note: this is a testing field, may be removed later
					},
				});

				return missingPermission.toJSON();
			}
		}

		await this.App.cassandra.models.Message.update({
			channelId: Encryption.encrypt(params.channelId),
			messageId: params.messageId,
			bucket: message.bucket,
			content: Encryption.encrypt(body.content),
			updatedDate: new Date(),
		});

		set.status = 204;

		// eslint-disable-next-line sonarjs/no-redundant-jump, no-useless-return
		return;
	}

	@Method("get")
	@Description("Change this Description when working on this route")
	@ContentTypes("any")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: "User",
		}),
	)
	public async getMessage({
		user,
		params,
		set,
	}: CreateRoute<"/channels/:channelId/messages/:messageId", any, [UserMiddlewareType]>) {
		const channel = await this.App.cassandra.models.Channel.get({
			channelId: Encryption.encrypt(params.channelId),
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

		const channelFlags = new FlagUtils(channel.type, Constants.channelTypes);

		if (channelFlags.hasOneArray(["Dm", "GroupChat"])) {
			// todo: other logic here later

			set.status = 500;

			return "Internal Server Error :(";
		} else {
			const guildMember = await this.App.cassandra.models.GuildMember.get({
				guildId: channel.guildId!,
				userId: Encryption.encrypt(user.id),
				left: false
			});

			if (!guildMember) {
				unknownChannel.addError({
					channel: {
						code: "UnknownChannel",
						message: "The provided channel does not exist or you do not have access to it.",
					},
				});

				set.status = 404;

				return unknownChannel.toJSON();
			}

			const guildMemberFlags = new GuildMemberFlags(guildMember.flags);

			if (!guildMemberFlags.has("In")) {
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
								this.App.cassandra.models.PermissionOverride.get({ permissionId: id }),
							),
						)
					).filter(Boolean) as PermissionsOverrides[])
				: [];
			// eslint-disable-next-line @typescript-eslint/promise-function-async
			const roles = (
				await Promise.all(
					guildMember.roles.map(async (id) =>
						this.App.cassandra.models.Role.get({ roleId: id, guildId: channel.guildId! }),
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

			if (!permissionCheck.hasChannelPermission(Encryption.decrypt(channel.channelId), ["ViewMessageHistory"])) {
				set.status = 403;

				const missingPermission = errorGen.MissingPermissions();

				missingPermission.addError({
					channel: {
						code: "MissingPermissions",
						message: 'You are missing the "ViewMessageHistory" permission.',
						requiredPermissions: ["ViewMessageHistory"], // ? note: this is a testing field, may be removed later
					},
				});

				return missingPermission.toJSON();
			}
		}

		const message = await this.tryMessage(params.channelId, params.messageId);

		if (!message) {
			set.status = 404;

			const unknownMessage = errorGen.UnknownMessage();

			unknownMessage.addError({
				message: {
					code: "UnknownMessage",
					message: "The provided message does not exist or you do not have access to it.",
				},
			});

			return unknownMessage.toJSON();
		}

		const userData = await this.App.cassandra.models.User.get(
			{
				userId: message.authorId,
			},
			{
				fields: ["userId", "username", "globalNickname", "tag", "avatar", "publicFlags", "flags"],
			},
		);

		return Encryption.completeDecryption({
			id: message.messageId,
			author: {
				id: userData?.userId ?? "0",
				username: userData?.username ?? "Unknown User",
				globalNickname: userData?.globalNickname ?? null,
				tag: userData?.tag ?? "0000",
				avatar: userData?.avatar ?? null,
				publicFlags: userData?.publicFlags ?? Constants.publicFlags.GhostBadge,
				flags: userData?.flags ?? Constants.privateFlags.Ghost,
			},
			content: message.content,
			creationDate: new Date(this.App.snowflake.timeStamp(message.messageId.toString())).toISOString(),
			editedDate: message.updatedDate?.toISOString() ?? null,
			embeds: [],
			nonce: null,
			replyingTo: message.replyingTo ?? null,
			attachments: [],
			flags: message.flags,
			allowedMentions: message.allowedMentions,
			mentions: {
				channels: message.mentionChannels ?? [],
				roles: [],
				users: message.mentions ?? [],
			},
			pinned: false,
			deletable: true,
		});
	}

	public async fetchMessage(channelId: string, messageId: string, bucket: string) {
		return this.App.cassandra.models.Message.get({
			channelId: Encryption.encrypt(channelId),
			messageId,
			bucket,
		});
	}

	public async tryMessage(channelId: string, messageId: string) {
		const buckets = this.App.getBuckets(channelId);

		for (const bucket of buckets) {
			const message = await this.fetchMessage(channelId, messageId, bucket);

			if (message) return message;
		}

		return null;
	}
}
