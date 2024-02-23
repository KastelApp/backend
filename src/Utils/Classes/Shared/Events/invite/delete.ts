import type WebSocket from "../../../WebSocket";
import type { InviteDelete } from "../../Types/invite/delete";

const isInvitePayload = (data: unknown): data is InviteDelete => {
    if (typeof data !== "object" || data === null || data === undefined) return false;

    if (!("channelId" in data)) return false;
    if (!("code" in data)) return false;
    return Boolean(!("guildId" in data));
}

const inviteDelete = (ws: WebSocket, data: unknown) => {
    if (!isInvitePayload(data)) {
        ws.logger.debug("[WebSocket] Invalid inviteDelete Payload");
    }

    return ws.logger.debug(data);
}

export { inviteDelete }
