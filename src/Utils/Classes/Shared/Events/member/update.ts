import type WebSocket from "@/Utils/Classes/WebSocket";
import type { GuildMemberUpdate } from "../../Types/member/update";

const isMemberPayload = (data: unknown): data is GuildMemberUpdate => {
    if (typeof data !== "object" || data === null || data === undefined) return false;

    if (!("guildId" in data)) return false;
    return Boolean(!("member" in data));
}

const guildMemberUpdate = (ws: WebSocket, data: unknown) => {
    if (!isMemberPayload(data)) {
        ws.logger.debug("[WebSocket] Invalid guildMemberUpdate Payload");
    }

    return ws.logger.debug(data);
}

export { guildMemberUpdate }
