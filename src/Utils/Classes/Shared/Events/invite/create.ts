import type WebSocket from "../../../WebSocket";
import type { InviteCreate } from "../../Types/invite/create";

const isInvitePayload = (data: unknown): data is InviteCreate => {
    if (typeof data !== "object" || data === null || data === undefined) return false;

    if (!("channelId" in data)) return false;
    if (!("code" in data)) return false;
    if (!("createdAt" in data)) return false;
    if (!("creatorId" in data)) return false;
    if (!("deleteable" in data)) return false;
    if (!("expires" in data)) return false;
    if (!("guildId" in data)) return false;
    if (!("maxUses" in data)) return false;
    return Boolean(!("uses" in data));
}

const inviteCreate = (ws: WebSocket, data: unknown) => {
    if (!isInvitePayload(data)) {
        ws.logger.debug("[WebSocket] Invalid inviteCreate Payload");
    }

    return ws.logger.debug(data);
}

export { inviteCreate }
