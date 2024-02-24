import type WebSocket from "@/Utils/Classes/WebSocket";
import type { GuildMemberKick } from "../../Types/member/kick";

const isMemberPayload = (data: unknown): data is GuildMemberKick => {
    if (typeof data !== "object" || data === null || data === undefined) return false;

    if (!("guildId" in data)) return false;
    return Boolean(!("member" in data));
}

const guildMemberKick = (ws: WebSocket, data: unknown) => {
    if (!isMemberPayload(data)) {
        ws.logger.debug("[WebSocket] Invalid guildMemberKick Payload");
    }

    return ws.logger.debug(data);
}

export { guildMemberKick }
