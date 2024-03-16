import { join } from "node:path";
import { URL } from "node:url";
import { isMainThread, type Server } from "bun";
import { presenceTypes, statusTypes } from "@/Constants.ts";
import { validate } from "@/Middleware/BodyValidator.ts";
import App from "./App.ts";
import Encryption from "./Encryption.ts";
import { errorCodes } from "./Events/Errors.ts";
import EventBuilder from "./Events/Event.ts";
import { opCodes } from "./Events/OpCodes.ts";
import type { WsOptions } from "./Events/User.ts";
import User from "./Events/User.ts";
import FileSystemRouter from "./FileSystemRouter.ts";
import {
	banCreate,
	banDelete,
	channelCreate,
	channelDelete,
	channelUpdate,
	guildCreate,
	guildDelete,
	guildMemberAdd,
	guildMemberBan,
	guildMemberKick,
	guildMemberRemove,
	guildMemberUnban,
	guildMemberUpdate,
	guildUpdate,
	inviteCreate,
	inviteDelete,
	inviteUpdate,
	messageCreate,
	messageDelete,
	messageReported,
	messageUpdated,
	presenceUpdate,
	roleCreate,
	roleDelete,
	roleUpdate,
	sessionCreate,
	sessionDelete,
	userUpdate,
	messageTyping,
} from "./Shared/Events/index.ts";
import type { GetChannelTypes, channels } from "./Shared/RabbitMQ.ts";

declare const self: Worker;

class WebSocket extends App {
	private eventDirectory: string = join(import.meta.dirname, "../../Events");

	public mainSocket!: Server;

	public topics: Map<string, Set<User>> = new Map();

	public router: FileSystemRouter;

	public eventCache: Map<
		string,
		{
			eventClass: EventBuilder;
			file: string;
			opCode: number;
			version: number;
		}
	> = new Map();

	public clients: Map<string, User> = new Map(); // sessionId -> User

	public constructor() {
		super("WSS");

		this.logger.colorTypes = {
			...this.logger.colorTypes,
			info: "#158aad",
		};

		this.router = new FileSystemRouter({
			dir: this.eventDirectory,
			style: "nextjs",
			watch: true,
			allowIndex: false,
		});

		self.onmessage = (event: MessageEvent) => {
			if (event.data.type === "config") {
				postMessage({ type: "config", data: this.config });
			}

			if (!this.isRabbitMessage(event.data)) {
				this.logger.warn("Invalid RabbitMQ message");

				return;
			}

			switch (event.data.topic) {
				case "ban.create": {
					banCreate(this, event.data.data);
					break;
				}

				case "ban.delete": {
					banDelete(this, event.data.data);
					break;
				}

				case "channel.create": {
					channelCreate(this, event.data.data);
					break;
				}

				case "channel.delete": {
					channelDelete(this, event.data.data);
					break;
				}

				case "channel.update": {
					channelUpdate(this, event.data.data);
					break;
				}

				case "guild.create": {
					guildCreate(this, event.data.data);
					break;
				}

				case "guild.delete": {
					guildDelete(this, event.data.data);
					break;
				}

				case "guild.update": {
					guildUpdate(this, event.data.data);
					break;
				}

				case "guildMember.add": {
					guildMemberAdd(this, event.data.data);
					break;
				}

				case "guildMember.ban": {
					guildMemberBan(this, event.data.data);
					break;
				}

				case "guildMember.kick": {
					guildMemberKick(this, event.data.data);
					break;
				}

				case "guildMember.remove": {
					guildMemberRemove(this, event.data.data);
					break;
				}

				case "guildMember.unban": {
					guildMemberUnban(this, event.data.data);
					break;
				}

				case "guildMember.update": {
					guildMemberUpdate(this, event.data.data);
					break;
				}

				case "invite.create": {
					inviteCreate(this, event.data.data);
					break;
				}

				case "invite.delete": {
					inviteDelete(this, event.data.data);
					break;
				}

				case "invite.update": {
					inviteUpdate(this, event.data.data);
					break;
				}

				case "message.create": {
					messageCreate(this, event.data.data);
					break;
				}

				case "message.delete": {
					messageDelete(this, event.data.data);
					break;
				}

				case "message.reported": {
					messageReported(this, event.data.data);
					break;
				}

				case "message.update": {
					messageUpdated(this, event.data.data);
					break;
				}

				case "presence.update": {
					presenceUpdate(this, event.data.data);
					break;
				}

				case "role.create": {
					roleCreate(this, event.data.data);
					break;
				}

				case "role.delete": {
					roleDelete(this, event.data.data);
					break;
				}

				case "role.update": {
					roleUpdate(this, event.data.data);
					break;
				}

				case "sessions.create": {
					sessionCreate(this, event.data.data);
					break;
				}

				case "sessions.delete": {
					sessionDelete(this, event.data.data);
					break;
				}

				case "user.update": {
					userUpdate(this, event.data.data);
					break;
				}

				case "message.typing": {
					messageTyping(this, event.data.data);

					break;
				}

				default: {
					this.logger.warn(`Unknown topic: ${event.data.topic}`);
				}
			}
		};
	}

	public override async init(): Promise<void> {
		await super.init();

		this.router.on("reload", async ({ path, type, directory }) => {
			this.logger.verbose(
				`Reloaded Events due to a ${directory ? "directory" : "file"} (${path}) being ${type === "A" ? "Added" : type === "M" ? "Modified" : type === "D" ? "Removed" : "Unknown"
				}`,
			);

			if (!directory && type !== "D") {
				const loaded = await this.loadEvents(path);

				if (!loaded) {
					this.logger.warn(`Failed to load event ${path}`);

					return;
				}

				this.logger.info(`Re-loaded Event ${loaded}`);
			}
		});

		this.mainSocket = Bun.serve<WsOptions>({
			port: this.config.ws.port,
			websocket: {
				message: (ws, message) => {
					const parsed = JSON.parse(message.toString());

					if (!this.isCorrectPayload(parsed)) {
						ws.data.user.close(errorCodes.invalidPayload);

						return;
					}

					const foundEvent = this.eventCache.get(`${parsed.op}-${ws.data.user.version ?? 0}`);

					if (!foundEvent) {
						this.logger.warn(`Invalid opcode ${parsed.op} for version ${ws.data.user.version}`);

						ws.data.user.close(errorCodes.invalidOpCode);

						return;
					}

					const foundOp = foundEvent.eventClass.__opcodes.find((op) => op.code === parsed.op);

					if (!foundOp) {
						this.logger.warn(`Invalid opcode ${parsed.op} for version ${ws.data.user.version}`);

						ws.data.user.close(errorCodes.invalidOpCode); // ! more of an internal server error but meh

						return;
					}

					// @ts-expect-error -- its fine :3
					const event = foundEvent.eventClass[foundOp.name].bind(foundEvent.eventClass) as (
						user: User,
						data: unknown,
						ws: WebSocket,
					) => Promise<void> | void;

					if (!event) {
						ws.data.user.close(errorCodes.internalServerError);

						return;
					}

					const bodyValidator = foundEvent.eventClass?.__validator?.find(
						(validator) => validator.name === foundOp.name,
					);
					const authRequired = foundEvent.eventClass?.__authRequired?.find((auth) => auth.name === foundOp.name);

					if (authRequired?.auth === true && !ws.data.user.token) {
						ws.data.user.close(errorCodes.unauthorized);

						return;
					} else if (authRequired?.auth === false && ws.data.user.token) {
						ws.data.user.close(errorCodes.alreadyAuthorized); // ? mainly for identify

						return;
					}

					if (bodyValidator) {
						const validated = validate([], parsed.data as Record<string, unknown>, bodyValidator.body);

						if (validated.length > 0) {
							ws.data.user.close(errorCodes.invalidPayload);

							return;
						}
					}

					void event(ws.data.user, parsed.data, this);
				},
				open: (ws) => {
					const newUser = new User(this).setWs(ws);

					ws.data.user = newUser;

					const params = new URL(ws.data.url).searchParams;

					const version = params.get("version");
					const encoding = params.get("encoding");

					if (version) newUser.version = Number(version);
					else newUser.version = 1;

					if (encoding) {
						if (encoding === "json") newUser.encoding = encoding;
						else {
							newUser.close(errorCodes.unknownError);

							return;
						}
					}

					if (newUser.version && !this.eventCache.has(`${opCodes.identify}-${newUser.version}`)) {
						// ? if the client sends a version, we'll check if the identify event exists for that version else disconnect
						newUser.close(errorCodes.unknownError);

						return;
					}

					newUser.ip = ws.data.ip;

					this.clients.set(newUser.sessionId, newUser);

					newUser.send({
						op: opCodes.hello,
						data: {
							heartbeatInterval: newUser.heartbeatInterval,
							sessionId: newUser.sessionId,
						},
					});
				},
				close: async (ws, code) => {
					if (ws.data.user.expectingClose) {
						if (!ws.data.user.resumeable) {
							this.clients.delete(ws.data.user.sessionId);
						}
					} else {
						ws.data.user.closedAt = Date.now();

						// if code was 4090, then it was a client close but they want to stay resumable
						if (code === 4_090) {
							ws.data.user.expectingClose = true;
							ws.data.user.resumeable = true;
						}
					}

					if (ws.data.user.guilds) {
						const got = await this.cache.get(`user:${Encryption.encrypt(ws.data.user.id)}`);

						const parsed = JSON.parse(
							(got as string) ??
							`[{ "sessionId": null, "since": null, "state": null, "type": ${presenceTypes.custom}, "status": ${statusTypes.offline} }]`,
						) as { sessionId: string | null; since: number | null; state: string | null; status: number; type: number; }[];

						const filtered = parsed.filter((prec) => prec.sessionId !== ws.data.user.sessionId);

						if (filtered.length === 0) {
							filtered.push({
								sessionId: null,
								since: null,
								state: null,
								status: statusTypes.offline,
								type: presenceTypes.custom,
							});
						}

						for (const guild of ws.data.user.guilds) {
							this.publish(`guild:${guild}:members`, {
								op: opCodes.event,
								event: "PresencesUpdate",
								data: {
									user: {
										id: ws.data.user.fetchedUser.id,
										username: ws.data.user.fetchedUser.username,
										avatar: ws.data.user.fetchedUser.avatar,
										tag: ws.data.user.fetchedUser.tag,
										publicFlags: ws.data.user.fetchedUser.publicFlags,
										flags: ws.data.user.fetchedUser.flags,
									},
									guildId: guild,
									presences: filtered.map((prec) => ({
										...prec,
										sessionId: undefined,
										current: undefined,
									})),
								},
							});
						}

						if (got) await this.cache.set(`user:${Encryption.encrypt(ws.data.user.id)}`, JSON.stringify(filtered));
					}
				},
			},
			hostname: "0.0.0.0",
			fetch: (request, server) => {
				if (this.clients.size >= Number(this.config.ws.maxConnections)) {
					return new Response("Too many connections");
				}

				const ip = server.requestIP(request)?.address ?? "";

				const requestsByIp = Array.from(this.clients.values()).filter((user) => user.ip === ip && ip !== "");

				if (requestsByIp.length >= Number(this.config.ws.maxConnectionsPerIp)) {
					return new Response("Too many connections from your IP");
				}

				const upgraded = server.upgrade<WsOptions>(request, {
					data: {
						headers: request.headers,
						url: request.url,
						user: null!,
						ip,
					},
				});

				if (!upgraded) {
					return new Response("Could not upgrade you, sorry");
				}

				return new Response();
			},
		});

		for (const [name, route] of Object.entries(this.router.routes)) {
			const loaded = await this.loadEvents(route);

			if (!loaded) {
				this.logger.warn(`Failed to load ${name}`);

				continue;
			}

			this.logger.info(`Loaded Event ${loaded}`);
		}

		if (isMainThread) this.logger.info(`Listening on port ${this.config.ws.port}`);
		else postMessage({ type: "ready", data: { port: this.config.ws.port } });

		this.handleHeartbeats();
		this.handleClosedConnects();
		this.handleUnauthedUsers();
	}

	private handleHeartbeats() {
		setInterval(() => {
			for (const user of this.clients.values()) {
				if (user.lastHeartbeat === 0) continue;

				if (
					user.lastHeartbeat + user.heartbeatInterval + Number(this.config.ws.intervals.heartbeat.leeway) <
					Date.now()
				) {
					user.close(errorCodes.heartbeatTimeout);
				}
			}
		}, Number(this.config.ws.intervals.heartbeat.interval));
	}

	private handleClosedConnects() {
		setInterval(async () => {
			for (const user of this.clients.values()) {
				if (user.closedAt === 0) continue;

				if (!user.resumeable) {
					this.clients.delete(user.sessionId);

					if (user.token && user.settings.status === "online") await user.setStatus("offline");

					continue;
				}

				if (user.closedAt + Number(this.config.ws.intervals.closeTimeout.leeway) < Date.now()) {
					this.clients.delete(user.sessionId);

					if (user.token && user.settings.status !== "offline") await user.setStatus("offline");
				}
			}
		}, Number(this.config.ws.intervals.closeTimeout.interval));
	}

	private handleUnauthedUsers() {
		setInterval(() => {
			for (const user of this.clients.values()) {
				if (user.token) continue;

				if (user.openedAt + Number(this.config.ws.intervals.closeTimeout.leeway) < Date.now()) {
					user.close(errorCodes.unauthorized);
				}
			}
		}, Number(this.config.ws.intervals.closeTimeout.interval));
	}

	private async loadEvents(path: string) {
		try {
			// this is a hack to make sure it doesn't cache the file
			const eventClass = (await import(`${path}?t=${Date.now()}`)) as { default: typeof EventBuilder; };

			if (!eventClass.default) {
				this.logger.warn(`Skipping ${path} as it does not have a default export`);

				return null;
			}

			const routeInstance = new eventClass.default(this);

			if (!(routeInstance instanceof EventBuilder)) {
				this.logger.warn(`Skipping ${path} as it does not extend Events`);

				return null;
			}

			const version = this.getVersion(path);

			for (const op of routeInstance.__opcodes) {
				const hash = `${op.code}-${version ?? "0"}`;

				this.eventCache.set(hash, {
					eventClass: routeInstance,
					file: path,
					opCode: op.code,
					version: version ?? 0,
				});
			}

			return path.split("/").pop()!.split(".").shift();
		} catch {
			return null;
		}
	}

	public getVersion(path: string) {
		const matched = /\/v(?<version>\d+)\//.exec(path);

		if (!matched) return null;

		return Number(matched[1]);
	}

	public getSessionId() {
		return App.snowflake.generate();
	}

	public getHeartbeatInterval() {
		const maxInterval = 1_000 * 45; // 45 seconds
		const minimumInterval = 1_000 * 35; // 35 seconds

		const interval = Math.floor(Math.random() * (maxInterval - minimumInterval + 1) + minimumInterval);

		return Math.round(interval);
	}

	public isRabbitMessage(
		data: unknown,
	): data is { data: unknown; topic: GetChannelTypes<typeof channels>; workerId: number; } {
		if (typeof data !== "object" || !data) {
			this.logger.warn("data is not an object");

			return false;
		}

		if (!("workerId" in data)) {
			this.logger.warn("workerId is not in data");

			return false;
		}

		if (!("topic" in data)) {
			this.logger.warn("topic is not in data");

			return false;
		}

		return "data" in data;
	}

	public isCorrectPayload(data: unknown): data is { data: unknown; op: number; } {
		if (typeof data !== "object" || !data) {
			this.logger.warn("data is not an object");

			return false;
		}

		if (!("op" in data)) {
			this.logger.warn("op is not in data");

			return false;
		}

		return "data" in data;
	}

	public publish(topic: string, data: unknown, ignoreUsers: User[] = []) {
		const users = this.topics.get(topic);

		if (!users) {
			this.logger.debug(`No users subscribed to ${topic}`);

			return 0;
		}

		for (const user of users) {
			if (ignoreUsers.includes(user)) continue;

			user.send(typeof data === "object" ? { ...data, seq: user.sequence } : data);
		}

		return users.size;
	}

	public subscribe(
		opt: {
			sessionId?: string;
			topic?: string;
			userId?: string;
			userIds?: string[];
			users?: User[]; // ? anyone subscribed to this topic, sub them to the new topic
		},
		topics: string[] | string,
	) {
		// ? if there's nothing throw an error, there has to be at least one thing
		if (!opt.sessionId && !opt.userId && !opt.userIds && !opt.users) {
			throw new Error("You must provide at least one of sessionId, userId, userIds or users");
		}

		// ? if there's a sessionId, we'll get the user from the sessionId
		if (opt.sessionId) {
			const user = this.clients.get(opt.sessionId);

			if (!user) {
				throw new Error("Invalid sessionId");
			}

			for (const topic of topics) {
				user.subscribe(topic);
			}

			return true;
		}

		// ? if there's a userId, we'll get the user from the userId
		if (opt.userId) {
			for (const user of this.clients.values()) {
				if (user.id === opt.userId) {
					for (const topic of topics) {
						user.subscribe(topic);
					}
				}
			}

			return true;
		}

		// ? if there's userIds, we'll get the user from the userIds
		if (opt.userIds) {
			for (const user of this.clients.values()) {
				if (opt.userIds.includes(user.id)) {
					for (const topic of topics) {
						user.subscribe(topic);
					}
				}
			}

			return true;
		}

		if (opt.users) {
			for (const user of opt.users) {
				for (const topic of topics) {
					user.subscribe(topic);
				}
			}

			return true;
		}

		if (opt.topic) {
			const users = this.topics.get(opt.topic);

			if (!users) return 0;

			for (const user of users) {
				for (const topic of topics) {
					user.subscribe(topic);
				}
			}

			return true;
		}

		return false;
	}

	public getTopic(topic: string) {
		return this.topics.get(topic) ?? new Set();
	}

	public unsubscribe(topic: string, user: User | User[]) {
		const users = this.topics.get(topic);

		if (!users) return;
		
		if (Array.isArray(user)) {
			for (const u of user) {
				users.delete(u);
			}
		} else {
			users.delete(user);
		}


		if (users.size === 0) this.topics.delete(topic);

		return users.size;
	}
}

export default WebSocket;

export { WebSocket };
