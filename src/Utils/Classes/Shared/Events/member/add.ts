import type WebSocket from "@/Utils/Classes/WebSocket";
import type { GuildMemberAdd } from "../../Types/member/add";

const isMemberPayload = (data: unknown): data is GuildMemberAdd => {
    if (typeof data !== "object" || data === null || data === undefined) return false;

    if (!("guildId" in data)) return false;
    return Boolean(!("member" in data));
}

const guildMemberAdd = (ws: WebSocket, data: unknown) => {
    if (!isMemberPayload(data)) {
        ws.logger.debug("[WebSocket] Invalid guildMemberAdd Payload");
    }

    return ws.logger.debug(data);
}

export { guildMemberAdd }
