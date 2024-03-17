import { permissionOverrideTypes, presenceTypes, statusTypes } from "@/Constants.ts";
import type { finishedGuild } from "@/Routes/v1/guilds/index.ts";
import FetchGuilds from "@/Routes/v1/guilds/index.ts";
import FetchPatch from "@/Routes/v1/users/@me/index.ts";
import type { Infer } from "@/Types/BodyValidation.ts";
import { enums, number, string } from "@/Types/BodyValidation.ts";
import Encryption from "@/Utils/Classes/Encryption.ts";
import AuthRequired from "@/Utils/Classes/Events/Decorators/AuthRequired.ts";
import Description from "@/Utils/Classes/Events/Decorators/Description.ts";
import OpCode from "@/Utils/Classes/Events/Decorators/OpCode.ts";
import Validator from "@/Utils/Classes/Events/Decorators/Validator.ts";
import { errorCodes } from "@/Utils/Classes/Events/Errors.ts";
import Event from "@/Utils/Classes/Events/Event.ts";
import { opCodes } from "@/Utils/Classes/Events/OpCodes.ts";
import type User from "@/Utils/Classes/Events/User.ts";
import type WebSocket from "@/Utils/Classes/WebSocket.ts";
import PermissionHandler from "@/Utils/Versioning/v1/PermissionCheck.ts";

const heartbeatData = {
	seq: number(),
};

const identifyData = {
	token: string(),
	meta: {
		os: string(),
		device: enums(["desktop", "mobile", "browser"]),
		client: string().optional(), // ? client data i.e "eyJ2ZXJzaW9uIjoiMC4wLjY4IiwiY29tbWl0IjoiZmFhMzE0MyIsImJyYW5jaCI6ImRldmVsb3BtZW50In0=" which is the version, commit & branch
	},
};

interface identifyFinishedGuilds extends finishedGuild {
	channelProperties: {
		channelId: string;
		lastMessageAckId: string | null;
		timedoutUntil: string | null; // ? for slowmode, let the client know when they can start typing again
	}[];
	members?: {
		joinedAt: string;
		nickname: string | null;
		owner: boolean;
		presence: {
			since: number | null;
			state: string | null;
			status: number;
			type: number;
		}[];
		roles: string[];
		user: {
			avatar: string | null;
			flags: string;
			id: string;
			publicFlags: string;
			tag: string;
			username: string;
		};
	}[];
	unavailable: boolean;
}

export default class IdentifyAndHeartbeat extends Event {
	public constructor(App: WebSocket) {
		super(App);
	}

	@Description("Heartbeat to keep the connection alive")
	@OpCode(opCodes.heartbeat)
	@AuthRequired()
	@Validator(heartbeatData)
	public heartbeat(user: User, data: Infer<typeof heartbeatData>) {
		this.App.logger.debug(
			`Expecting ${user.sequence}, received ${data.seq}, is correct: ${data.seq === user.sequence}`,
		);

		if (data.seq !== user.sequence) {
			user.close(errorCodes.invalidSequence); // ? if the seq is not the same as the last seq, close the connection

			return;
		}

		if (user.lastHeartbeat + 10_000 > Date.now()) return; // ? if the last heartbeat was less than 10 seconds ago, ignore it

		user.lastHeartbeat = Date.now();

		user.send(
			{
				op: opCodes.heartbeatAck,
				data: null,
			},
			false,
		);
	}

	@Description("Identify the user to the server")
	@OpCode(opCodes.identify)
	@AuthRequired(false)
	@Validator(identifyData)
	public async identify(user: User, data: Infer<typeof identifyData>) {
		const authed = await user.authenticate(data.token);

		if (!authed) return; // ? nothing else to do

		user.metadata = data.meta;

		user.subscribe(`user:${user.id}`); // ? anything related to the user

		// @ts-expect-error -- For the most part they are the same, nothing that only the API has is used
		const fetchGuildData = new FetchGuilds(this.App);
		// @ts-expect-error -- For the most part they are the same, nothing that only the API has is used
		const fetchUserData = new FetchPatch(this.App);

		// @ts-expect-error -- nothing else needed
		const fetchedGuilds = await fetchGuildData.getGuilds({
			user: user.translation(),
			query: {
				include: "channels,roles,owners",
			},
		});

		const fetchedUser = await fetchUserData.getFetch({
			user: user.translation(),
			query: {
				include: "bio",
			},
			// @ts-expect-error -- nothing else needed
			set: {
				status: 200,
			},
		});

		if (typeof fetchedUser === "string") {
			user.close(errorCodes.internalServerError);

			return;
		}

		user.fetchedUser = fetchedUser;

		const finishedGuilds: identifyFinishedGuilds[] = [];

		if (user.settings.status === "offline") {
			await user.setStatus("online");
		}

		const got = await this.App.cache.get(`user:${Encryption.encrypt(user.id)}`);

		if (!got || typeof got !== "string") {
			await this.App.cache.set(
				`user:${Encryption.encrypt(user.id)}`,
				JSON.stringify([
					{
						type: presenceTypes.custom,
						state: user.settings.customStatus,
						status: user.settings.status,
						since: Date.now(),
						sessionId: user.sessionId,
					},
				]),
			);
		}

		const parsed = JSON.parse((got as string) ?? "[]") as {
			sessionId: string | null;
			since: number | null;
			state: string | null;
			status: number;
			type: number;
		}[];

		const presences = [
			{
				type: presenceTypes.custom,
				state: user.settings.customStatus,
				status: user.settings.status,
				since: Date.now(),
				current: true,
				sessionId: user.sessionId,
			},
			...parsed.map((prec) => ({
				...prec,
				current: false,
			})),
		];

		for (const guild of fetchedGuilds) {
			user.subscribe(`guild:${guild.id}`);
			user.subscribe(`guild:${guild.id}:members`);

			const finishedGuild: identifyFinishedGuilds = {
				name: guild.name ?? null,
				description: guild.description ?? null,
				features: guild.features ?? [],
				id: guild.id,
				icon: guild.icon ?? null,
				owner: guild.owner ?? null,
				coOwners: guild.coOwners ?? [],
				maxMembers: guild.maxMembers ?? 0,
				flags: guild.flags ?? 0,
				channels: guild.channels ?? [],
				roles: guild.roles ?? [],
				members: [],
				channelProperties: [],
				unavailable: false,
			};

			const guildMember = await this.App.cassandra.models.GuildMember.get({
				guildId: Encryption.encrypt(guild.id),
				userId: Encryption.encrypt(user.id),
			});

			if (!guildMember) {
				this.App.logger.warn(`GuildMember not found for ${user.id} in ${guild.id}`);

				continue;
			}

			for (const ack of guildMember.channelAcks ?? []) {
				finishedGuild.channelProperties.push({
					channelId: ack.channelId,
					lastMessageAckId: ack.messageId,
					timedoutUntil: null,
				});
			}

			for (const timeout of guildMember.timeouts ?? []) {
				const foundChannel = finishedGuild.channelProperties.find((channel) => channel.channelId === timeout.channelId);

				if (foundChannel) {
					foundChannel.timedoutUntil = timeout.timeoutUntil.toISOString();
				} else {
					finishedGuild.channelProperties.push({
						channelId: timeout.channelId,
						lastMessageAckId: null,
						timedoutUntil: timeout.timeoutUntil.toISOString(),
					});
				}
			}

			const first100Members = (
				await this.App.cassandra.models.GuildMember.find({ guildId: Encryption.encrypt(guild.id) }, { limit: 100 })
			).toArray();

			const permCheck = new PermissionHandler(
				user.id,
				guildMember.flags,
				guild.roles?.map((role) => ({
					id: role.id,
					permissions: role.permissions,
					position: role.position,
				})) ?? [],
				guild.channels?.map((channel) => ({
					id: channel.id,
					overrides: Object.entries(channel.permissionOverrides).map(([id, override]) => ({
						id,
						allow: override.allow,
						deny: override.deny,
						type: override.type === permissionOverrideTypes.Member ? "Member" : "Role",
					})),
				})) ?? [],
			);

			for (const channel of finishedGuild.channels!) {
				if (!finishedGuild.channelProperties.some((prop) => prop.channelId === channel.id)) {
					finishedGuild.channelProperties.push({
						channelId: channel.id,
						lastMessageAckId: null,
						timedoutUntil: null,
					});
				}

				if (permCheck.hasChannelPermission(channel.id, ["ViewChannels"])) {
					user.subscribe(`channel:messages:${channel.id}`);
					user.subscribe(`channel:messages:${channel.id}:reactions`);
					user.subscribe(`channel:messages:${channel.id}:pins`);
				}

				if (permCheck.hasChannelPermission(channel.id, ["ViewChannels", "ViewMessageHistory"]))
					user.subscribe(`channel:messages:${channel.id}:typing`); // ? can only see typing events if they can see the channel and view messages

				user.subscribe(`channel:${channel.id}`);
			}

			for (const member of Encryption.completeDecryption(first100Members)) {
				const fetchedUser = await this.App.cassandra.models.User.get(
					{ userId: Encryption.encrypt(member.userId) },
					{ fields: ["username", "userId", "flags", "publicFlags", "avatar", "tag"] },
				);

				if (!fetchedUser) {
					this.App.logger.warn(`User not found for ${member.userId} in ${guild.id}`);

					continue;
				}

				const data = {
					user: {
						username: fetchedUser.username,
						id: fetchedUser.userId,
						flags: fetchedUser.flags,
						publicFlags: fetchedUser.publicFlags,
						avatar: fetchedUser.avatar,
						tag: fetchedUser.tag,
					},
					owner: finishedGuild.owner?.id === member.userId,
					nickname: member.nickname,
					roles: member.roles,
					joinedAt: member.joinedAt.toISOString(),
					presence: [],
				};

				if (data.user.id === Encryption.encrypt(user.id)) {
					// @ts-expect-error -- it's fine
					data.presence = presences;
				} else {
					const fetchedPresence = await this.App.cache.get(`user:${fetchedUser.userId}`);
					const parsedPresence = JSON.parse(
						(fetchedPresence as string) ??
							`[{ "sessionId": null, "since": null, "state": null, "type": ${presenceTypes.custom}, "status": ${statusTypes.offline} }]`,
					) as { sessionId: string | null; since: number | null; state: string | null; status: number; type: number }[];

					// @ts-expect-error -- it's fine
					data.presence = parsedPresence.map((pre) => ({
						...pre,
						sessionId: undefined,
						current: undefined,
					}));
				}

				finishedGuild.members?.push(data);
			}

			finishedGuilds.push(finishedGuild);

			this.App.publish(
				`guild:${guild.id}:members`,
				{
					op: opCodes.event,
					event: "PresencesUpdate",
					data: {
						user: {
							id: fetchedUser.id,
							username: fetchedUser.username,
							avatar: fetchedUser.avatar,
							tag: fetchedUser.tag,
							publicFlags: fetchedUser.publicFlags,
							flags: fetchedUser.flags,
						},
						guildId: guild.id,
						presences: presences.map((pre) => ({
							...pre,
							sessionId: undefined,
							current: undefined,
						})),
					},
				},
				[user],
			);
		}

		user.lastHeartbeat = Date.now();

		user.send({
			op: opCodes.ready,
			data: {
				user: fetchedUser,
				guilds: finishedGuilds,
				settings: {
					language: user.settings.language,
					privacy: user.settings.privacy,
					theme: user.settings.theme,
					guildOrder: user.settings.guildOrder,
					emojiPack: user.settings.emojiPack ?? "twemoji",
					navBarLocation: user.settings.navBarLocation ?? "bottom",
				},
				presence: presences,
			},
			seq: user.sequence + 1,
		});

		await this.App.cache.set(`user:${Encryption.encrypt(user.id)}`, JSON.stringify(presences));
	}
}
