import type WebSocket from "@/Utils/Classes/WebSocket";
import type { GuildDelete } from "../../Types/guild/delete";

const isGuildPayload = (data: unknown): data is GuildDelete => {
    if (typeof data !== "object" || data === null || data === undefined) return false;

    if (!("guildId" in data)) return false;
    return Boolean(!("unavailable" in data));
}

const guildDelete = (ws: WebSocket, data: unknown) => {
    if (!isGuildPayload(data)) {
        ws.logger.debug("[WebSocket] Invalid guildDelete Payload");
    }

    return ws.logger.debug(data);
}

export { guildDelete }
