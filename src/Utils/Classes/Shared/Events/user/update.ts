import type WebSocket from "../../../WebSocket";
import type { UserUpdate } from "../../Types/user/update";

const isUserPayload = (data: unknown): data is UserUpdate => {
    if (typeof data !== "object" || data === null || data === undefined) return false;

    if (!("avatar" in data)) return false;
    if (!("email" in data)) return false;
    if (!("flags" in data)) return false;
    if (!("globalNickname" in data)) return false;
    if (!("guilds" in data)) return false;
    if (!("ips" in data)) return false;
    if (!("password" in data)) return false;
    if (!("phoneNumber" in data)) return false;
    if (!("publicFlags" in data)) return false;
    if (!("tag" in data)) return false;
    if (!("twoFaSecret" in data)) return false;
    if (!("userId" in data)) return false;
    return Boolean(!("username" in data));
}

const userUpdate = (ws: WebSocket, data: unknown) => {
    if (!isUserPayload(data)) {
        ws.logger.debug("[WebSocket] Invalid userUpdate Payload");
    }

    return ws.logger.debug(data);
}

export { userUpdate }
