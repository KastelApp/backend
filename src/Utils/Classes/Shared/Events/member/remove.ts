import { opCodes } from "@/Utils/Classes/Events/OpCodes.ts";
import type WebSocket from "@/Utils/Classes/WebSocket";
import type { GuildMemberRemove } from "../../Types/member/remove";

const isMemberPayload = (data: unknown): data is GuildMemberRemove => {
	if (typeof data !== "object" || data === null || data === undefined) return false;

	if (!("guildId" in data)) return false;
	
	return "userId" in data;
};

const guildMemberRemove = (ws: WebSocket, data: unknown) => {
	if (!isMemberPayload(data)) {
		ws.logger.debug("Invalid guildMemberRemove Payload");
		
		return;
	}

	ws.publish(`guild:${data.guildId}:members`, {
		op: opCodes.event,
		event: "GuildMemberRemove",
		data: {
			guildId: data.guildId,
			userId: data.userId,
		},
	});
};

export { guildMemberRemove };
