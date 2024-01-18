/* eslint-disable id-length */
import type { Buffer } from "node:buffer";
import zlib from "node:zlib";
import { WebSocket } from "ws";
import type { AuthedPayload, NormalPayload } from "../../../Types/Socket/MiscPayloads";
import type App from "../App.ts";
import { opCodes, systemOpCodes } from "../WsUtils.ts";
import Events from "./Events.ts";

class SystemSocket {
	public Ws: WebSocket | null;

	public Sequence: number;

	public HeartbeatInterval: Timer | null;

	public LastHeartbeat: number | null;

	public LastHeartbeatAck: number | null;

	public SessionId: string | null;

	public ApproximateMembers: number;

	public FailedConnectionAttempts: number;

	public Events: Events;

	public App: App;

	private Resolved: boolean;

	private Interval: number;

	public constructor(App: App) {
		this.App = App;

		this.Ws = null;

		this.Sequence = 0;

		this.HeartbeatInterval = null;

		this.LastHeartbeat = null;

		this.LastHeartbeatAck = null;

		this.SessionId = null;

		this.ApproximateMembers = 0;

		this.FailedConnectionAttempts = 0; // We allow for 15 failed connection attempts before we stop trying to connect

		this.Interval = 5_000; // 5 seconds

		this.Events = new Events(this);

		this.Resolved = false;
	}

	public async Connect(): Promise<void> {
		return new Promise<void>((resolve) => {
			this.Ws = new WebSocket(
				`${this.App.config.ws.url}?v=${this.App.config.ws.version ?? 0}&p=${encodeURIComponent(this.App.config.ws.password)}&c=true&encoding=json`,
				{},
			);
			
			this.Ws.addEventListener("error", () => {
				this.App.Logger.error("Failed to connect to System Socket / Recieved an Error");

				this.HandleDisconnect();

				resolve();

				if (!this.Resolved) {
					this.Resolved = true;

					resolve();
				}
			});

			this.Ws.addEventListener("open", () => {
				this.App.Logger.info("Connected to System Socket");
			});

			this.Ws.addEventListener("close", ({ code, reason }) => {
				this.App.Logger.warn("Disconnected from System Socket", reason?.toString(), code);

				this.HandleDisconnect();

				if (!this.Resolved) {
					this.Resolved = true;
					resolve();
				}
			});
			
			this.Ws.addEventListener("message", ({ data }) => {
				const decoded = this.decode(data as Buffer);

				if (decoded?.S) this.Sequence = decoded.S;

				if (decoded?.Authed === true) {
					this.App.Logger.info("Authed to System Socket");

					this.FailedConnectionAttempts = 0; // Reset the failed connection attempts (Since we are now connected)

					const authPayload = decoded as AuthedPayload;

					this.SessionId = authPayload.Misc.SessionId;

					this.ApproximateMembers = authPayload.ApproximateMembers;

					if (typeof authPayload.Misc.HeartbeatInterval === "number") {
						this.App.Logger.debug("Starting Heartbeat Interval");
						this.HeartbeatInterval = setInterval(() => {
							this.App.Logger.debug("Sending Heartbeat");
							this.Ws?.send(
								JSON.stringify({
									Op: opCodes.HeartBeat,
									D: {
										Sequence: this.Sequence,
									},
								}),
							);
							this.LastHeartbeat = Date.now();

							this.App.Logger.debug("Heartbeat Sent");
						}, authPayload.Misc.HeartbeatInterval - 2_000);
					}

					if (!this.Resolved) {
						this.Resolved = true;
						resolve();
					}
				}

				if (decoded?.Op) {
					const normalPayload = decoded as NormalPayload;

					this.App.Logger.debug(`Received Payload: ${JSON.stringify(normalPayload)}`);

					switch (normalPayload.Op) {
						case opCodes.HeartBeatAck:
							this.LastHeartbeatAck = Date.now();
							this.App.Logger.debug("Heartbeat Acknowledged");
							break;

						case Object.values(systemOpCodes).find((op) => op === normalPayload.Op):
							this.App.Logger.debug(
								`Received Event: ${Object.keys(systemOpCodes).find(
									(op) => systemOpCodes[op as keyof typeof systemOpCodes] === normalPayload.Op,
								)}`,
							);
							break;
					}
				}
			});
		});
	}

	private decode(data: Buffer): any {
		try {
			// eslint-disable-next-line n/no-sync
			const zlibDecoded = zlib.unzipSync(data);

			return JSON.parse(zlibDecoded.toString());
		} catch {
			try {
				return JSON.parse(data.toString());
			} catch {
				return null;
			}
		}
	}

	public HandleDisconnect(Force: boolean = false): void {
		if (Force && this.Ws) return;

		if (this.HeartbeatInterval) {
			clearInterval(this.HeartbeatInterval);
			this.HeartbeatInterval = null;
		}

		this.Ws?.removeAllListeners();

		if (!Force && this.FailedConnectionAttempts > 1 && this.FailedConnectionAttempts % 15 === 0) {
			this.Interval += 30_000;

			this.App.Logger.error(
				`Failed to connect to System Socket 15 times, increasing the interval to ${this.Interval / 1_000} seconds`,
			);
		}

		this.FailedConnectionAttempts++;
		this.Ws = null;

		this.App.Logger.debug(`Attempting to reconnect to System Socket, attempt ${this.FailedConnectionAttempts}`);

		setTimeout(async () => {
			await this.Connect();
		}, this.Interval);
	}
}

export default SystemSocket;

export { SystemSocket };
