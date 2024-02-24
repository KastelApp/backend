import type WebSocket from "../../../WebSocket";
import type { InviteUpdate } from "../../Types/invite/update";

const isInvitePayload = (data: unknown): data is InviteUpdate => {
    if (typeof data !== "object" || data === null || data === undefined) return false;

    if (!("channelId" in data)) return false;
    if (!("code" in data)) return false;
    return Boolean(!("guildId" in data));
}

const inviteUpdate = (ws: WebSocket, data: unknown) => {
    if (!isInvitePayload(data)) {
        ws.logger.debug("[WebSocket] Invalid inviteUpdate Payload");
    }

    return ws.logger.debug(data);
}

export { inviteUpdate }
