import { opCodes } from "@/Utils/Classes/Events/OpCodes.ts";
import type WebSocket from "@/Utils/Classes/WebSocket";
import type { GuildMemberChunk } from "../../Types/member/chunk.ts";

const isMemberPayload = (data: unknown): data is GuildMemberChunk => {
	if (typeof data !== "object" || data === null || data === undefined) return false;

	const items = [
		"userId",
		"guildId",
		"members"
	];

	for (const item of items) {
		if (!(item in data)) return false;
	}

	return true;
};

const guildMemberChunk = async (ws: WebSocket, data: unknown) => {
	if (!isMemberPayload(data)) {
		ws.logger.debug("Invalid guildMemberChunk Payload");

		return;
	}
	
    ws.publish(`user:${data.userId}`, {
        op: opCodes.event,
        event: "GuildMemberChunk",
        data: {
            guildId: data.guildId,
            members: data.members,
        },
    })
};

export { guildMemberChunk };
