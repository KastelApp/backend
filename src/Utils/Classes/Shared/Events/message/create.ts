import type WebSocket from "../../../WebSocket";
import type { MessageCreate } from "../../Types/message/create";

const isMessagePayload = (data: unknown): data is MessageCreate => {
    if (typeof data !== "object" || data === null || data === undefined) return false;

    if (!("allowedMentions" in data)) return false;
    if (!("attachments" in data)) return false;
    if (!("authorId" in data)) return false;
    if (!("bucket" in data)) return false;
    if (!("channelId" in data)) return false;
    if (!("content" in data)) return false;
    if (!("embeds" in data)) return false;
    if (!("flags" in data)) return false;
    if (!("guildId" in data)) return false;
    if (!("member" in data)) return false;
    if (!("mentionChannels" in data)) return false;
    if (!("mentionRoles" in data)) return false;
    if (!("mentions" in data)) return false;
    if (!("messageId" in data)) return false;
    if (!("replyingTo" in data)) return false;
    return Boolean(!("updatedDate" in data));
}

const messageCreate = (ws: WebSocket, data: unknown) => {
    if (!isMessagePayload(data)) {
        ws.logger.debug("[WebSocket] Invalid messageCreate Payload");
    }

    return ws.logger.debug(data);
}

export { messageCreate }
