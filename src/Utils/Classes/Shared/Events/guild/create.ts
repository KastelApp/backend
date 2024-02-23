import type WebSocket from "@/Utils/Classes/WebSocket";
import type { GuildCreate } from "../../Types/guild/create";

const isGuildPayload = (data: unknown): data is GuildCreate => {
    if (typeof data !== "object" || data === null || data === undefined) return false;

    if (!("guild" in data)) return false;
    return Boolean(!("userId" in data));
}

const guildCreate = (ws: WebSocket, data: unknown) => {
    if (!isGuildPayload(data)) {
        ws.logger.debug("[WebSocket] Invalid guildCreate Payload");
    }

    return ws.logger.debug(data);
}

export { guildCreate }
