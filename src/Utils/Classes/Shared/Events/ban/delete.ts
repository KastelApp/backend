import type WebSocket from "@/Utils/Classes/WebSocket";
import type { BanDelete } from "../../Types/ban/delete";

const isBanPayload = (data: unknown): data is BanDelete => {
    if (typeof data !== "object" || data === null || data === undefined) return false;

    if (!("ban" in data)) return false;
    return Boolean(!("userId" in data))
}

const banDelete = (ws: WebSocket, data: unknown) => {
    if (!isBanPayload(data)) {
        ws.logger.debug("[WebSocket] Invalid banDelete Payload");
    }

    return ws.logger.debug(data);
}

export { banDelete }
