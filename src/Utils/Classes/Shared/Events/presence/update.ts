import { opCodes } from "@/Utils/Classes/Events/OpCodes.ts";
import type WebSocket from "../../../WebSocket";
import type { PresenceUpdate } from "../../Types/presence/update";

const isPresencePayload = (data: unknown): data is PresenceUpdate => {
	if (typeof data !== "object" || data === null || data === undefined) return false;

	if (!("guildId" in data)) return false;
	if (!("presences" in data)) return false;
	if (!("guilds" in data)) return false;

	return "user" in data;
};

const presenceUpdate = (ws: WebSocket, data: unknown) => {
	if (!isPresencePayload(data)) {
		ws.logger.debug("Invalid presenceUpdate Payload", data);

		return;
	}

	for (const guild of data.guilds) {
		ws.publish(`guild:${guild}`, {
			op: opCodes.event,
			event: "PresencesUpdate",
			data: {
				user: {
					id: data.user.id,
					username: data.user.username,
					avatar: data.user.avatar,
					tag: data.user.tag,
					publicFlags: data.user.publicFlags,
					flags: data.user.flags,
				},
				guildId: guild,
				presences: data.presences.map((pre) => ({
					...pre,
					sessionId: undefined,
					current: undefined,
				})),
			}
		});
	}
};

export { presenceUpdate };
