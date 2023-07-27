/* eslint-disable id-length */
import type { Buffer } from 'node:buffer';
import process from 'node:process';
import { setTimeout, setInterval, clearInterval } from 'node:timers';
import zlib from 'node:zlib';
import WebSocket from 'ws';
import Config from '../../../Config.js';
import type { AuthedPayload, NormalPayload } from '../../../Types/Socket/MiscPayloads';
import type App from '../App.js';
import { OpCodes } from '../WsUtils.js';
import Events from './Events.js';

class SystemSocket {
	public Ws: WebSocket | null;

	public Sequence: number;

	public HeartbeatInterval: NodeJS.Timer | null;

	public LastHeartbeat: number | null;

	public LastHeartbeatAck: number | null;

	public SessionId: string | null;

	public ApproximateMembers: number;

	public FailedConnectionAttempts: number;

	public Events: Events;

	public App: App;

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

		this.Events = new Events(this);
	}

	public async Connect(): Promise<void> {
		return new Promise<void>((resolve) => {
			this.Ws = new WebSocket(
				`${Config.Ws.Url}?v=${Config.Ws.version ?? 0}&p=${encodeURIComponent(Config.Ws.Password)}&c=true&encoding=json`,
			);

			this.Ws.on('error', () => {
				this.App.Logger.error('Failed to connect to System Socket / Recieved an Error');

				this.HandleDisconnect();

				resolve();
			});

			this.Ws.on('open', () => {
				this.App.Logger.info('Connected to System Socket');
			});

			this.Ws.on('close', () => {
				this.App.Logger.warn('Disconnected from System Socket');

				this.HandleDisconnect();
			});

			this.Ws.on('message', (data: Buffer) => {
				// data is a buffer and a zlib compressed buffer (Should be since we sent c=true in the query)
				// so we need to decompress it
				const decoded = this.decode(data);

				if (decoded?.s) this.Sequence = decoded.s;

				if (decoded?.Authed === true) {
					this.App.Logger.info('Authed to System Socket');

					this.FailedConnectionAttempts = 0; // Reset the failed connection attempts (Since we are now connected)

					const AuthPayload = decoded as AuthedPayload;

					this.SessionId = AuthPayload.Misc.SessionId;

					this.ApproximateMembers = AuthPayload.ApproximateMembers;

					if (typeof AuthPayload.Misc.HeartbeatInterval === 'number') {
						this.App.Logger.debug('Starting Heartbeat Interval');
						this.HeartbeatInterval = setInterval(() => {
							this.App.Logger.debug('Sending Heartbeat');
							this.Ws?.send(
								JSON.stringify({
									op: OpCodes.HeartBeat,
									d: {
										Sequence: this.Sequence,
									},
								}),
							);
							this.LastHeartbeat = Date.now();

							this.App.Logger.debug(`Heartbeat Sent`);
						}, AuthPayload.Misc.HeartbeatInterval - 2_000);
					}

					resolve();
				}

				if (decoded?.op) {
					const NormalPayload = decoded as NormalPayload;

					this.App.Logger.debug(`Received Payload: ${JSON.stringify(NormalPayload)}`);

					switch (NormalPayload.op) {
						case OpCodes.HeartBeatAck:
							this.LastHeartbeatAck = Date.now();
							this.App.Logger.debug(`Heartbeat Acknowledged`);
							break;

						case Object.values(OpCodes).find((op) => op === NormalPayload.op):
							this.App.Logger.debug(
								`Received Event: ${Object.keys(OpCodes).find(
									(op) => OpCodes[op as keyof typeof OpCodes] === NormalPayload.op,
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
			const ZlibDecoded = zlib.unzipSync(data);

			return JSON.parse(ZlibDecoded.toString());
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

		if (!Force && this.FailedConnectionAttempts >= 15) {
			this.App.Logger.error('Failed to connect to System Socket 15 times, stopping attempts');
			return;
		}

		this.FailedConnectionAttempts++;
		this.Ws = null;

		this.App.Logger.info(`Attempting to reconnect to System Socket, attempt ${this.FailedConnectionAttempts}`);

		setTimeout(async () => {
			await this.Connect();
		}, 5_000);
	}
}

export default SystemSocket;

export { SystemSocket };
