import Config from "../../../Config";
import WebSocket from "ws";
import zlib from "zlib";
import type {
  AuthedPayload,
  NormalPayload,
} from "../../../Types/Socket/MiscPayloads";
import { WsUtils } from "../WsUtils";
import Events from "./Events";

class SystemSocket {
  Ws: WebSocket | null;
  Sequence: number;
  HeartbeatInterval: null | NodeJS.Timer;
  LastHeartbeat: null | number;
  LastHeartbeatAck: null | number;
  SessionId: null | string;
  ApproximateMembers: number;
  FailedConnectionAttempts: number;
  Events: Events;
  constructor() {
    this.Ws = null;

    this.Sequence = 0;

    this.HeartbeatInterval = null;

    this.LastHeartbeat = null;

    this.LastHeartbeatAck = null;

    this.SessionId = null;

    this.ApproximateMembers = 0;

    this.FailedConnectionAttempts = 0; // We allow for 15 failed connection attempts before we stop trying to connect

    this.Events = new Events(this)
  }

  Connect(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.Ws = new WebSocket(
        `${Config.Ws.Url}?v=${Config.Ws.version || 0}&p=${encodeURIComponent(
          Config.Ws.Password
        )}&c=true&encoding=json`
      );

      this.Ws.on("error", () => {
        console.log("[System Socket] Failed to connect to System Socket / Recieved an Error");

        this.HandleDisconnect()
      });

      this.Ws.on("open", () => {
        console.log("[System Socket] Connected to System Socket");
      });

      this.Ws.on("close", () => {
        console.log("[System Socket] Disconnected from System Socket");

        this.HandleDisconnect()
      });

      this.Ws.on("message", (data: Buffer) => {
        // data is a buffer and a zlib compressed buffer (Should be since we sent c=true in the query)
        // so we need to decompress it
        const decoded = this.decode(data);

        if (decoded?.s) this.Sequence = decoded.s;

        if (decoded?.Authed === true) {
          console.log("[System Socket] Authed to System Socket");

          this.FailedConnectionAttempts = 0; // Reset the failed connection attempts (Since we are now connected)

          const AuthPayload = decoded as AuthedPayload;

          this.SessionId = AuthPayload.Misc.SessionId;

          this.ApproximateMembers = AuthPayload.ApproximateMembers;

          if (typeof AuthPayload.Misc.HeartbeatInterval === "number") {
            this.debug("Starting Heartbeat Interval");
            this.HeartbeatInterval = setInterval(() => {
              this.debug("Sending Heartbeat");
              this.Ws?.send(
                JSON.stringify({
                  op: WsUtils.OpCodes.HeartBeat,
                  d: {
                    Sequence: this.Sequence,
                  },
                })
              );
              this.LastHeartbeat = Date.now();

              this.debug(`Heartbeat Sent`);
            }, AuthPayload.Misc.HeartbeatInterval - 2000);
          }

          resolve();
        }

        if (decoded?.op) {
          const NormalPayload = decoded as NormalPayload;

          this.debug(`Received Payload: ${JSON.stringify(NormalPayload)}`);

          switch (NormalPayload.op) {
            case WsUtils.OpCodes.HeartBeatAck:
              this.LastHeartbeatAck = Date.now();
              this.debug(`Heartbeat Acknowledged`);
              break;

            case Object.values(WsUtils.OpCodes).find((op) => op === NormalPayload.op):
              this.debug(`Received Event: ${Object.keys(WsUtils.OpCodes).find((op) => WsUtils.OpCodes[op as keyof typeof WsUtils.OpCodes] === NormalPayload.op)}`);
              break;
          }
        }
      });
    });
  }

  private decode(data: Buffer): any {
    try {
      const ZlibDecoded = zlib.unzipSync(data);

      return JSON.parse(ZlibDecoded.toString());
    } catch (er) {
      try {
        return JSON.parse(data.toString());
      } catch (er) {
        return null;
      }
    }
  }

  private debug(data: string): void {
    if (process.env.DEBUG)
    console.log(`[System Socket] ${data}`);
  }

  HandleDisconnect(Force: boolean = false): void {

    if (!Force && this.Ws) return;

    if (this.HeartbeatInterval) {
      clearInterval(this.HeartbeatInterval);
      this.HeartbeatInterval = null;
    }

    this.Ws?.removeAllListeners();

    if (!Force && this.FailedConnectionAttempts >= 15) {
      console.log(
        "[System Socket] Failed to connect to System Socket 15 times, stopping attempts"
      );
      return;
    }

    this.FailedConnectionAttempts++;
    this.Ws = null;

    console.log(
      `[System Socket] Attempting to reconnect to System Socket, attempt ${this.FailedConnectionAttempts}`
    );

    setTimeout(() => {
      this.Connect();
    }, 5000);
  }
}

export default SystemSocket;

export { SystemSocket };
