import type WebSocket from "@/Utils/Classes/WebSocket";
import type { GuildMemberUnban } from "../../Types/member/unban";

const isMemberPayload = (data: unknown): data is GuildMemberUnban => {
    if (typeof data !== "object" || data === null || data === undefined) return false;

    if (!("guildId" in data)) return false;
    return Boolean(!("member" in data));
}

const guildMemberUnban = (ws: WebSocket, data: unknown) => {
    if (!isMemberPayload(data)) {
        ws.logger.debug("[WebSocket] Invalid guildMemberUnban Payload");
    }

    return ws.logger.debug(data);
}

export { guildMemberUnban }
