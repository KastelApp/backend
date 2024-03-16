import type WebSocket from "@/Utils/Classes/WebSocket";
import type { GuildMemberBan } from "../../Types/member/ban";

const isMemberPayload = (data: unknown): data is GuildMemberBan => {
	if (typeof data !== "object" || data === null || data === undefined) return false;

	if (!("guildId" in data)) return false;
	return Boolean(!("member" in data));
};

const guildMemberBan = (ws: WebSocket, data: unknown) => {
	if (!isMemberPayload(data)) {
		ws.logger.debug("Invalid guildMemberBan Payload");
	}

	return ws.logger.debug(data);
};

export { guildMemberBan };
