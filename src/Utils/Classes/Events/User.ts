import type { ServerWebSocket } from "bun";
import { statusTypes } from "@/Constants.ts";
import { type User as UserType } from "@/Routes/v1/users/@me/index.ts";
import FlagFields from "../BitFields/Flags.ts";
import Encryption from "../Encryption.ts";
import Token from "../Token.ts";
import type WebSocket from "../WebSocket.ts";
import { errorCodes } from "./Errors.ts";

interface WsOptions {
	headers: Request["headers"];
	ip: string;
	url: string;
	user: User;
}

class User {
	public rawSocket!: ServerWebSocket<WsOptions>;

	readonly #App!: WebSocket;

	public bot!: boolean;

	public email!: string;

	public flagsUtil!: FlagFields;

	public guilds!: string[];

	public id!: string;

	public password!: string;

	public settings!: {
		allowedInvites: number;
		bio: string | null;
		customStatus: string | null;
		emojiPack: "fluentui-emoji" | "native" | "noto-emoji" | "twemoji";
		guildOrder: {
			guildId: string;
			position: number;
		}[];
		language: string;
		navBarLocation: "bottom" | "left";
		privacy: number;
		status: "dnd" | "idle" | "invisible" | "offline" | "online";
		theme: string;
	};

	public token!: string;

	public username!: string;

	#events: Map<string, Set<Function>> = new Map();

	public closedAt: number = 0;

	public openedAt: number = Date.now();

	public resumeable: boolean = false;

	public sessionId: string = "";

	public heartbeatInterval: number = 0;

	public lastHeartbeat: number = 0;

	public lastHeartbeatAck: number = 0;

	public version: number = 0;

	public encoding: string = "json";

	public expectingClose: boolean = false;

	public ip!: string;

	public metadata!: {
		// ? Meta data is just for statistics
		client?: string;
		device: "browser" | "desktop" | "mobile";
		os: string;
	};

	public sequence: number = 0; // ? -1 due to the hello packet

	public fetchedUser!: UserType;

	public constructor(App: WebSocket) {
		this.#App = App;
		this.sessionId = this.#App.getSessionId();
		this.heartbeatInterval = this.#App.getHeartbeatInterval();
	}

	// eslint-disable-next-line promise/prefer-await-to-callbacks
	public on(event: "close", callback: Function) {
		if (!this.#events.has(event)) this.#events.set(event, new Set());

		this.#events.get(event)!.add(callback);

		return this;
	}

	public emit(event: "close") {
		if (!this.#events.has(event)) return;

		for (const callback of this.#events.get(event)!) {
			// eslint-disable-next-line n/callback-return, promise/prefer-await-to-callbacks
			callback();
		}

		return this;
	}

	public setWs(ws: ServerWebSocket<WsOptions>) {
		this.rawSocket = ws;

		return this;
	}

	public subscribe(topic: string) {
		if (!this.App.topics.has(topic)) this.App.topics.set(topic, new Set());

		this.App.topics.get(topic)!.add(this);

		return this;
	}

	public unsubscribe(topic: string) {
		if (!this.App.topics.has(topic)) return;

		this.App.topics.get(topic)!.delete(this);

		if (this.App.topics.get(topic)!.size === 0) this.App.topics.delete(topic);

		return this;
	}

	public publish(topic: string, data: { data: any; event?: string; op: number }) {
		if (!this.App.topics.has(topic)) return this;

		for (const user of this.App.topics.get(topic)!) {
			user.send(JSON.stringify(data));
		}

		return this;
	}

	public getTopics(nonSubscribed: boolean = false) {
		return nonSubscribed
			? Array.from(this.App.topics.keys())
			: Array.from(this.App.topics.keys()).filter((topic) => this.App.topics.get(topic)!.has(this));
	}

	public get App() {
		return this.#App;
	}

	public close(
		code?: number | { code?: number; reason?: string; reconnect?: boolean },
		reason?: string,
		reconnect?: boolean,
	) {
		const realCode = (typeof code === "number" ? code : code?.code ?? errorCodes.unknownError.code)!;
		const realReason = (typeof code === "number" ? reason : code?.reason ?? errorCodes.unknownError.reason)!;
		const realReconnect = (
			typeof code === "number" ? reconnect : code?.reconnect ?? errorCodes.unknownError.reconnect
		)!;

		this.expectingClose = true;

		this.rawSocket.close(realCode, realReason);

		this.emit("close"); // ? unsure if I want to keep this

		this.closedAt = Date.now();
		this.resumeable = realReconnect;

		return this;
	}

	public send(data: any, seq = true) {
		this.rawSocket.send(typeof data === "string" ? data : this.#App.jsonStringify(data));

		if (seq) this.sequence++;

		return this;
	}

	public async authenticate(token: string): Promise<boolean> {
		const validatedToken = Token.validateToken(token);

		if (!validatedToken) {
			this.close(errorCodes.invalidToken);

			return false;
		}

		const decodedToken = Token.decodeToken(token);

		const usersSettings = await this.App.cassandra.models.Settings.get(
			{
				userId: Encryption.encrypt(decodedToken.Snowflake),
			},
			{
				fields: [
					"tokens",
					"maxFileUploadSize",
					"bio",
					"guildOrder",
					"language",
					"privacy",
					"theme",
					"status",
					"allowedInvites",
					"customStatus",
					"navLocation",
					"emojiPack",
				],
			},
		);

		const userData = await this.App.cassandra.models.User.get(
			{
				userId: Encryption.encrypt(decodedToken.Snowflake),
			},
			{
				fields: ["email", "userId", "flags", "password", "publicFlags", "guilds", "username"],
			},
		);

		if (!usersSettings || !userData || !usersSettings.tokens) {
			this.App.logger.debug("User not found in database");
			this.App.logger.debug(userData ?? "null", usersSettings ?? "null");

			if ((userData && !usersSettings) || (!userData && usersSettings)) {
				this.close(errorCodes.internalServerError);

				return false;
			}

			this.close(errorCodes.invalidToken);

			return false;
		}

		if (!usersSettings.tokens.some((usrToken) => usrToken.token === Encryption.encrypt(token))) {
			this.close(errorCodes.invalidToken);

			return false;
		}

		const userFlags = new FlagFields(userData.flags, userData.publicFlags);

		if (
			userFlags.has("AccountDeleted") ||
			userFlags.has("WaitingOnAccountDeletion") ||
			userFlags.has("Disabled") ||
			userFlags.has("WaitingOnDisableDataUpdate") ||
			userFlags.has("Terminated")
		) {
			this.close(errorCodes.accountUnAvailable);

			return false;
		}

		const completeDecrypted = Encryption.completeDecryption({
			...userData,
			flags: userData.flags.toString(),
			publicFlags: userData.publicFlags.toString(),
		});

		this.bot = userFlags.has("Bot") || userFlags.has("VerifiedBot");
		this.token = token;
		this.flagsUtil = userFlags;
		this.email = completeDecrypted.email;
		this.id = completeDecrypted.userId;
		this.guilds = completeDecrypted.guilds ?? [];
		this.username = completeDecrypted.username;
		this.password = completeDecrypted.password!;
		this.settings = Encryption.completeDecryption({
			allowedInvites: usersSettings.allowedInvites,
			bio: usersSettings.bio,
			guildOrder: usersSettings.guildOrder ?? [],
			language: usersSettings.language,
			privacy: usersSettings.privacy,
			status: this.App.status.get(usersSettings.status),
			theme: usersSettings.theme,
			customStatus: usersSettings.customStatus,
			emojiPack: usersSettings.emojiPack,
			navBarLocation: usersSettings.navLocation,
		});

		return true;
	}

	public translation() {
		// This is a "translation" layer for the API's middleware, basically just returns what the user middleware would
		return {
			bot: this.bot,
			email: this.email,
			flagsUtil: this.flagsUtil,
			guilds: this.guilds,
			id: this.id,
			password: this.password,
			settings: this.settings,
			token: this.token,
			username: this.username,
		};
	}

	public async setStatus(status: "dnd" | "idle" | "invisible" | "offline" | "online") {
		let stat = statusTypes[this.settings.status]; // old status

		if (status === "offline") stat |= statusTypes.offline;
		else stat &= ~statusTypes.offline;

		if (stat === 0) stat = statusTypes[status];

		this.settings.status = this.App.status.get(stat);

		await this.App.cassandra.models.Settings.update({
			userId: Encryption.encrypt(this.id),
			status: statusTypes[status],
		});

		return this;
	}
}

export default User;

export { User, type WsOptions };
