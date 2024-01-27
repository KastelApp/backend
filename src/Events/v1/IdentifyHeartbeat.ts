import { permissionOverrideTypes, presenceTypes } from "@/Constants.ts";
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

interface finishedGuilds {
	channels?: {
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
	coOwners?: string[];
	description?: string | null;
	features?: string[];
	flags?: number;
	icon: string | null;
	id: string;
	maxMembers?: number;
	members?: { nickname: string | null; owner: boolean; roles: string[]; user: { avatar: string | null; flags: string; id: any; publicFlags: string; username: string; }; }[];
	name: string;
	owner?: {
		avatar: string | null;
		flags: string;
		globalNickname: string | null;
		id: string;
		publicFlags: string;
		tag: string;
		username: string;
	} | null | undefined;
	roles?: {
		allowedAgeRestricted: boolean;
		color: number;
		hoist: boolean;
		id: string;
		name: string;
		permissions: [string, string][];
		position: number;
	}[];
	unavailable?: boolean;
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
		this.App.logger.debug(`Expecting ${user.sequence}, received ${data.seq}, is correct: ${data.seq === user.sequence}`)
		
		if (data.seq !== user.sequence) {
			user.close(errorCodes.invalidSequence); // ? if the seq is not the same as the last seq, close the connection

			return;
		}

		if (user.lastHeartbeat + 10_000 > Date.now()) return; // ? if the last heartbeat was less than 10 seconds ago, ignore it

		user.lastHeartbeat = Date.now();

		user.send({
			op: opCodes.heartbeatAck,
			data: null,
		}, false);
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
				include: "channels,roles,owners"
			}
		});

		const fetchedUser = await fetchUserData.getFetch({
			user: user.translation(),
			query: {
				include: "bio"
			},
			// @ts-expect-error -- nothing else needed
			set: {
				status: 200
			}
		});

		if (typeof fetchedUser === "string") {
			user.close(errorCodes.internalServerError);

			return;
		}

		const finishedGuilds: finishedGuilds[] = [];

		for (const guild of fetchedGuilds) {
			user.subscribe(`guild:${guild.id}`);

			const finishedGuild: finishedGuilds = {
				name: guild.name,
				description: guild.description,
				features: guild.features,
				id: guild.id,
				icon: guild.icon,
				owner: guild.owner,
				coOwners: guild.coOwners,
				maxMembers: guild.maxMembers,
				flags: guild.flags,
				channels: guild.channels,
				roles: guild.roles,
				members: []
			};

			const guildMember = await this.App.cassandra.models.GuildMember.get({ guildId: Encryption.encrypt(guild.id), userId: Encryption.encrypt(user.id) });

			if (!guildMember) {
				this.App.logger.warn(`GuildMember not found for ${user.id} in ${guild.id}`);

				continue;
			}

			const first100Members = (await this.App.cassandra.models.GuildMember.find({ guildId: Encryption.encrypt(guild.id) }, { limit: 100 })).toArray();

			const permCheck = new PermissionHandler(user.id, guildMember.flags, guild.roles.map((role) => ({
				id: role.id,
				permissions: role.permissions,
				position: role.position
			})), guild.channels.map((channel) => ({
				id: channel.id,
				overrides: Object.entries(channel.permissionOverrides).map(([id, override]) => ({
					id,
					allow: override.allow,
					deny: override.deny,
					type: override.type === permissionOverrideTypes.Role ? "Role" : permissionOverrideTypes.Everyone ? "Role" : "Member"
				}))
			})));

			for (const channel of guild.channels) {
				if (permCheck.hasChannelPermission(channel.id, ["ViewChannels"])) {
					user.subscribe(`channel:messages:${channel.id}`);
					user.subscribe(`channel:messages:${channel.id}:reactions`);
					user.subscribe(`channel:messages:${channel.id}:pins`);
				}
				
				if (permCheck.hasChannelPermission(channel.id, ["ViewChannels", "ViewMessageHistory"])) user.subscribe(`channel:messages:${channel.id}:typing`); // ? can only see typing events if they can see the channel and view messages
				
				user.subscribe(`channel:${channel.id}`)
			}

			for (const member of Encryption.completeDecryption(first100Members)) {
				const fetchedUser = await this.App.cassandra.models.User.get({ userId: Encryption.encrypt(member.userId) }, { fields: ["username", "user_id", "flags", "public_flags", "avatar"] });

				if (!fetchedUser) {
					this.App.logger.warn(`User not found for ${member.userId} in ${guild.id}`);

					continue;
				}

				finishedGuild.members?.push({
					user: {
						username: fetchedUser.username,
						id: fetchedUser.userId,
						flags: fetchedUser.flags,
						publicFlags: fetchedUser.publicFlags,
						avatar: fetchedUser.avatar
					},
					owner: finishedGuild.owner?.id === member.userId,
					nickname: member.nickname,
					roles: member.roles,
				});
			}

			finishedGuilds.push(finishedGuild);
		}

		user.lastHeartbeat = Date.now();
		
		if (user.settings.status === "offline") {
			await user.setStatus("online")
		}

		user.send({
			op: opCodes.ready,
			data: {
				user: fetchedUser,
				guilds: finishedGuilds,
				settings: {
					language: user.settings.language,
					privacy: user.settings.privacy,
					theme: user.settings.theme,
					guildOrder: user.settings.guildOrder
				},
				presence: [{
					type: presenceTypes.custom,
					state: user.settings.customStatus,
					status: user.settings.status,
					since: Date.now(),				
				}]
			},
			seq: user.sequence + 1
		});
	}
}
