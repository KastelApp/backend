import type WebSocket from "../../../WebSocket";
import type { MessageReported } from "../../Types/message/report";

const isMessagePayload = (data: unknown): data is MessageReported => {
    if (typeof data !== "object" || data === null || data === undefined) return false;

    if (!("channelId" in data)) return false;
    if (!("guildId" in data)) return false;
    return Boolean(!("messageId" in data));
}

const messageReported = (ws: WebSocket, data: unknown) => {
    if (!isMessagePayload(data)) {
        ws.logger.debug("[WebSocket] Invalid messageReported Payload");
    }

    return ws.logger.debug(data);
}

export { messageReported }
