import { opCodes } from "@/Utils/Classes/Events/OpCodes.ts";
import type WebSocket from "@/Utils/Classes/WebSocket";
import type { GuildDelete } from "../../Types/guild/delete";

const isGuildPayload = (data: unknown): data is GuildDelete => {
	if (typeof data !== "object" || data === null || data === undefined) return false;

	return "guildId" in data;
};

const guildDelete = (ws: WebSocket, data: unknown) => {
	if (!isGuildPayload(data)) {
		ws.logger.debug("Invalid guildDelete Payload");

		return;
	}

	ws.publish(`guild:${data.guildId}`, { // ? Clients should remove any data related to the guild when they receive this event, we will not emit events for the guild after this event
		op: opCodes.event,
		event: "GuildDelete",
		data: {
			guildId: data.guildId,
		},
	});

	ws.topics.delete(`guild:${data.guildId}`);
};

export { guildDelete };
