import type WebSocket from "@/Utils/Classes/WebSocket";
import type { GuildDelete } from "../../Types/guild/delete";

const isGuildPayload = (data: unknown): data is GuildDelete => {
	if (typeof data !== "object" || data === null || data === undefined) return false;

	return Boolean(!("guild" in data));
};

const guildUpdate = (ws: WebSocket, data: unknown) => {
	if (!isGuildPayload(data)) {
		ws.logger.debug("Invalid guildUpdate Payload");
	}

	return ws.logger.debug(data);
};

export { guildUpdate };
