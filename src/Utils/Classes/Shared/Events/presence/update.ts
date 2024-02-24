import type WebSocket from "../../../WebSocket";
import type { PresenceUpdate } from "../../Types/presence/update";

const isPresencePayload = (data: unknown): data is PresenceUpdate => {
    if (typeof data !== "object" || data === null || data === undefined) return false;

    if (!("guildId" in data)) return false;
    if (!("status" in data)) return false;
    return Boolean(!("user" in data));
}

const presenceUpdate = (ws: WebSocket, data: unknown) => {
    if (!isPresencePayload(data)) {
        ws.logger.debug("[WebSocket] Invalid presenceUpdate Payload");
    }

    return ws.logger.debug(data);
}

export { presenceUpdate }
