import type WebSocket from "../../../WebSocket";
import type { RoleCreate } from "../../Types/role/create";

const isRolePayload = (data: unknown): data is RoleCreate => {
	if (typeof data !== "object" || data === null || data === undefined) return false;

	if (!("guildId" in data)) return false;
	if (!("role" in data)) return false;
	return Boolean(!("userId" in data));
};

const roleCreate = (ws: WebSocket, data: unknown) => {
	if (!isRolePayload(data)) {
		ws.logger.debug("Invalid roleCreate Payload");
	}

	return ws.logger.debug(data);
};

export { roleCreate };
