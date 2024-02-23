import type WebSocket from "../../../WebSocket";
import type { MessageDelete } from "../../Types/message/delete";

const isMessagePayload = (data: unknown): data is MessageDelete => {
    if (typeof data !== "object" || data === null || data === undefined) return false;

    if (!("channelId" in data)) return false;
    if (!("guildId" in data)) return false;
    return Boolean(!("messageId" in data));
}

const messageDelete = (ws: WebSocket, data: unknown) => {
    if (!isMessagePayload(data)) {
        ws.logger.debug("[WebSocket] Invalid messageDelete Payload");
    }

    return ws.logger.debug(data);
}

export { messageDelete }
