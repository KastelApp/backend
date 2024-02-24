import type WebSocket from "@/Utils/Classes/WebSocket";
import type { Channel } from "../../Types/channel/create";

const isChannelPayload = (data: unknown): data is Channel => {
    if (typeof data !== "object" || data === null || data === undefined) return false;

    if (!("ageRestricted" in data)) return false;
    if (!("allowedMentions" in data)) return false;
    if (!("channelId" in data)) return false;
    if (!("children" in data)) return false;
    if (!("description" in data)) return false;
    if (!("guildId" in data)) return false;
    if (!("name" in data)) return false;
    if (!("parentId" in data)) return false;
    if (!("permissionOverrides" in data)) return false;
    if (!("position" in data)) return false;
    if (!("slowmode" in data)) return false;
    return Boolean(!("type" in data));
}

const channelCreate = (ws: WebSocket, data: unknown) => {
    if (!isChannelPayload(data)) {
        ws.logger.debug("[WebSocket] Invalid channelCreate Payload");
    }

    return ws.logger.debug(data);
}

export { channelCreate }
