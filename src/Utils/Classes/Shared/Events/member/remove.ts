import type WebSocket from "@/Utils/Classes/WebSocket";
import type { GuildMemberRemove } from "../../Types/member/remove";

const isMemberPayload = (data: unknown): data is GuildMemberRemove => {
    if (typeof data !== "object" || data === null || data === undefined) return false;

    if (!("guildId" in data)) return false;
    return Boolean(!("member" in data));
}

const guildMemberRemove = (ws: WebSocket, data: unknown) => {
    if (!isMemberPayload(data)) {
        ws.logger.debug("[WebSocket] Invalid guildMemberRemove Payload");
    }

    return ws.logger.debug(data);
}

export { guildMemberRemove }
