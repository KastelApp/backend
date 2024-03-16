import Constants from "@/Constants.ts";
import bodyValidator from "@/Middleware/BodyValidator.ts";
import type { UserMiddlewareType } from "@/Middleware/User.ts";
import userMiddleware from "@/Middleware/User.ts";
import FetchPatch from "@/Routes/v1/users/@me/index.ts";
import { string, type Infer, snowflake, number, array, enums } from "@/Types/BodyValidation.ts";
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
import type { Message } from "@/Utils/Cql/Types/index.ts";
import { fetchMentions } from "@/Utils/Versioning/v1/FetchMentions.ts";
import PermissionHandler from "@/Utils/Versioning/v1/PermissionCheck.ts";
import DeleteEditGetMessage from "./[messageId]/index.ts";

const messageData = {
	content: string().optional().max(Constants.settings.Max.MessageLength),
	nonce: snowflake().optional(),
	flags: enums([Constants.messageFlags.Normal]),
	embeds: array({}).optional(),
	replyingTo: snowflake().optional(),
	allowedMentions: number().optional(),
};

export interface ReturnMessage {
	allowedMentions: number;
	attachments: never[];
	author: {
		avatar: string | null;
		flags: bigint | string;
		globalNickname: string | null;
		id: string;
		publicFlags: bigint | string;
		tag: string;
		username: string;
	};
	content: string;
	creationDate: string;
	deletable: boolean;
	editedDate: string | null;
	embeds: never[];
	flags: number;
	id: bigint | string;
	mentions: {
		channels: string[];
		roles: string[];
		users: string[];
	};
	nonce: null;
	pinned: boolean;
	replyingTo:
		| ReturnMessage
		| {
				channelId: string;
				messageId: string;
		  }
		| null;
}

export default class FetchCreateMessages extends Route {
	public constructor(App: API) {
		super(App);
	}

	@Method("get")
	@Description("Fetches messages in a specific channel")
	@ContentTypes("any")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: "User",
		}),
	)
	public async getMessages({
		user,
		params,
		query,
		set,
	}: CreateRoute<
		"/channels/:channelId/messages",
		any,
		[UserMiddlewareType],
		any,
		{
			after?: string;
			before?: string;
			limit?: string;
		}
	>) {
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
			});

			if (!guildMember) {
				set.status = 500;

				return "Internal Server Error :(";
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
								this.App.cassandra.models.PermissionOverride.get({ permissionId: Encryption.encrypt(id) }),
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

		const invalidRequest = errorGen.InvalidField();

		if ((query.limit && Number.isNaN(query.limit)) || Number(query.limit) < 1 || Number(query.limit) > 100) {
			invalidRequest.addError({
				limit: {
					code: "InvalidLimit",
					message: "The provided limit is invalid. It must be a number between 1 and 100.",
				},
			});
		}

		if (query.after && !this.App.snowflake.validate(query.after)) {
			invalidRequest.addError({
				after: {
					code: "InvalidAfter",
					message: "The provided after is invalid. It must be a snowflake.",
				},
			});
		}

		if (query.before && !this.App.snowflake.validate(query.before)) {
			invalidRequest.addError({
				before: {
					code: "InvalidBefore",
					message: "The provided before is invalid. It must be a snowflake.",
				},
			});
		}

		if (invalidRequest.hasErrors()) {
			set.status = 400;

			return invalidRequest.toJSON();
		}

		const messages = await this.getMessageData(params.channelId, Number(query.limit), query.before, query.after);

		const newMessages = [];

		for (const message of messages) {
			newMessages.push(Encryption.completeDecryption(await this.parseMessage(message)));
		}

		return newMessages;
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

	private buildQuery(
		channelId: string,
		bucket: string,
		limit = 50,
		before?: string,
		after?: string,
		order = "DESC",
		fields = ["*"],
	) {
		// ? we can trust fields since thats not user input
		let query = `SELECT ${fields.join(", ")} from messages WHERE channel_id = ? AND bucket = ?`;

		const params: (number | string)[] = [Encryption.encrypt(channelId), bucket];

		if (before) {
			query += " AND message_id < ?";
			params.push(before);
		}

		if (after) {
			query += " AND message_id > ?";
			params.push(after);
		}

		query += ` ORDER BY message_id ${order} LIMIT ?`;

		params.push(limit);

		return {
			query,
			params,
		};
	}

	private async getMessageData(
		channelId: string,
		limit = 50,
		before?: string,
		after?: string,
		fields?: string[],
	): Promise<Message[]> {
		const messages: Message[] = [];
		const possibleBuckets = this.App.getBuckets(channelId).reverse();

		for (const bucket of possibleBuckets) {
			const { query, params } = this.buildQuery(channelId, bucket, limit, before, after, "DESC", fields);

			const fetchedMessages = (await this.App.cassandra.client.execute(query, params, {
				prepare: true,
			})) as unknown as { rows: Message[] };

			messages.push(...this.App.cassandra.underscoreCqlToCamelCaseMappings.objectToFixedCasing(fetchedMessages.rows));

			if (messages.length >= limit) break;
		}

		return messages.slice(0, limit);
	}

	public async getLastMessageId(channelId: string) {
		return (
			(await this.getMessageData(channelId, 1, undefined, undefined, ["message_id"]))
				.map((message) => message.messageId)[0]
				?.toString() ?? null
		);
	}

	public async parseMessage(message: Message | null, levelsDeep = 0): Promise<ReturnMessage | null> {
		if (!message) return null;

		const userData = await this.App.cassandra.models.User.get(
			{
				userId: message.authorId,
			},
			{
				fields: ["userId", "username", "globalNickname", "tag", "avatar", "publicFlags", "flags"],
			},
		);

		return {
			id: message.messageId as bigint | string,
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
			replyingTo: message.replyingTo
				? levelsDeep < 3
					? await this.parseMessage(
							await this.tryMessage(Encryption.decrypt(message.channelId), Encryption.decrypt(message.replyingTo)),
							levelsDeep + 1,
						)
					: {
							messageId: message.replyingTo,
							channelId: message.channelId,
						}
				: null,
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
		};
	}

	@Method("post")
	@Description("Create a new message in a specific channel")
	@ContentTypes("application/json")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedIn",
			AllowedRequesters: "User",
		}),
	)
	@Middleware(bodyValidator(messageData))
	public async postMessages({
		body,
		params,
		set,
		user,
	}: CreateRoute<"/channels/:channelId/messages", Infer<typeof messageData>, [UserMiddlewareType]>) {
		if (!body.content && (body.embeds?.length ?? 0) > 0) {
			set.status = 400;

			const invalidContent = errorGen.EmptyMessage();

			invalidContent.addError({
				message: {
					code: "InvalidMessage",
					message: "You cannot send an empty message",
				},
			});

			return invalidContent.toJSON();
		}

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

			if (!permissionCheck.hasChannelPermission(Encryption.decrypt(channel.channelId), ["SendMessages"])) {
				set.status = 403;

				const missingPermission = errorGen.MissingPermissions();

				missingPermission.addError({
					channel: {
						code: "MissingPermissions",
						message: 'You are missing the "SendMessages" permission.',
						requiredPermissions: ["SendMessages"], // ? note: this is a testing field, may be removed later
					},
				});

				return missingPermission.toJSON();
			}
		}

		if (body.nonce) {
			const foundNonce = await this.App.cache.get<string | null>(
				`messageNonce:${Encryption.encrypt(user.id)}:${Encryption.encrypt(body.nonce)}`,
			);

			if (foundNonce) {
				// @ts-expect-error -- this is fine
				const fetchedMessage = await new DeleteEditGetMessage(this.App).getMessage({
					user,
					params: {
						channelId: params.channelId,
						messageId: Encryption.decrypt(foundNonce),
					},
					set,
				});

				if (set.status === 200) {
					return fetchedMessage;
				}

				set.status = 200; // set it back to normal
			}
		}

		if (body.replyingTo) {
			const fetchedMessage = await this.tryMessage(params.channelId, body.replyingTo);

			if (!fetchedMessage) {
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
		}

		const messageId = this.App.snowflake.generate();

		const mentions = fetchMentions(body.content ?? "");

		this.App.logger.debug(mentions);

		const insertMsg: Message = {
			allowedMentions: body.allowedMentions ?? 0,
			attachments: [],
			authorId: Encryption.encrypt(user.id),
			bucket: this.App.getBucket(params.channelId),
			channelId: Encryption.encrypt(params.channelId),
			content: Encryption.encrypt(body.content ?? ""),
			embeds: [],
			flags: body.flags ?? 0,
			mentionChannels: [],
			mentionRoles: [],
			mentions: [],
			messageId,
			replyingTo: body.replyingTo ? Encryption.encrypt(body.replyingTo) : null,
			updatedDate: null,
		};

		const allowedMentionFlags = new FlagUtils(insertMsg.allowedMentions, Constants.allowedMentions);

		if (allowedMentionFlags.hasOneArray(["Users", "All"])) {
			for (const userMention of mentions.users) {
				// fetch the user
				const fetchedUser = await this.App.cassandra.models.User.get(
					{
						userId: Encryption.encrypt(userMention),
					},
					{
						fields: ["userId", "flags", "publicFlags"],
					},
				);

				if (!fetchedUser) continue;

				insertMsg.mentions.push(Encryption.encrypt(userMention));

				const settings = await this.App.cassandra.models.Settings.get(
					{
						userId: Encryption.encrypt(userMention),
					},
					{
						fields: ["mentions"],
					},
				);

				if (!settings) continue;

				await this.App.cassandra.models.Settings.update({
					userId: Encryption.encrypt(userMention),
					mentions: (settings.mentions ?? []).concat({
						channelId: Encryption.encrypt(params.channelId),
						messageId: Encryption.encrypt(messageId),
						count: 1,
					}),
				});
			}
		}

		for (const channel of mentions.channels) {
			const channelExists = await this.App.cassandra.models.Channel.get({
				channelId: Encryption.encrypt(channel),
			});

			if (!channelExists) continue;

			insertMsg.mentionChannels.push(Encryption.encrypt(channel));
		}

		await this.App.cassandra.models.Message.insert(insertMsg);

		if (body.nonce) {
			await this.App.cache.set(
				`messageNonce:${Encryption.encrypt(user.id)}:${Encryption.encrypt(body.nonce)}`,
				Encryption.encrypt(messageId),
			);
		}

		// @ts-expect-error -- this is fine
		const fetchedUser = await new FetchPatch(this.App).getFetch({
			user,
			query: {},
			set,
		});

		if (set.status === 500 || fetchedUser === "Internal Server Error :(") {
			set.status = 500;

			return fetchedUser;
		}

		const message = {
			id: messageId,
			author: {
				id: fetchedUser.id,
				username: fetchedUser.username,
				globalNickname: fetchedUser.globalNickname,
				tag: fetchedUser.tag,
				avatar: fetchedUser.avatar,
				publicFlags: fetchedUser.publicFlags,
				flags: fetchedUser.flags,
			},
			content: body.content ?? null,
			creationDate: new Date(this.App.snowflake.timeStamp(messageId)).toISOString(),
			editedDate: null,
			embeds: [],
			nonce: body.nonce ?? null,
			replyingTo: body.replyingTo
				? await this.parseMessage(await this.tryMessage(params.channelId, body.replyingTo))
				: null,
			attachments: [],
			flags: body.flags ?? 0,
			allowedMentions: body.allowedMentions ?? 0,
			mentions: {
				channels: insertMsg.mentionChannels,
				roles: [],
				users: insertMsg.mentions,
			},
			pinned: false,
			deletable: true,
		};

		this.App.rabbitMQForwarder("message.create", {
			channelId: params.channelId,
			message: Encryption.completeDecryption(message),
		});

		return Encryption.completeDecryption(message);
	}
}
