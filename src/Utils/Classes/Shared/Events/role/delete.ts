import type WebSocket from "../../../WebSocket";
import type { RoleDelete } from "../../Types/role/delete";

const isRolePayload = (data: unknown): data is RoleDelete => {
    if (typeof data !== "object" || data === null || data === undefined) return false;

    if (!("guildId" in data)) return false;
    if (!("roleId" in data)) return false;
    return Boolean(!("userId" in data));
}

const roleDelete = (ws: WebSocket, data: unknown) => {
    if (!isRolePayload(data)) {
        ws.logger.debug("[WebSocket] Invalid roleDelete Payload");
    }

    return ws.logger.debug(data);
}

export { roleDelete }
