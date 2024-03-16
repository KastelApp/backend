import type WebSocket from "../../../WebSocket";
import type { RoleUpdate } from "../../Types/role/update";

const isRolePayload = (data: unknown): data is RoleUpdate => {
	if (typeof data !== "object" || data === null || data === undefined) return false;

	if (!("guildId" in data)) return false;
	if (!("role" in data)) return false;
	return Boolean(!("userId" in data));
};

const roleUpdate = (ws: WebSocket, data: unknown) => {
	if (!isRolePayload(data)) {
		ws.logger.debug("Invalid roleUpdate Payload");
	}

	return ws.logger.debug(data);
};

export { roleUpdate };
