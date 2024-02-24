import type WebSocket from "@/Utils/Classes/WebSocket";
import type { BanCreate } from "../../Types/ban/create";

const isBanPayload = (data: unknown): data is BanCreate => {
    if (typeof data !== "object" || data === null || data === undefined) return false;

    if (!("ban" in data)) return false;
    return Boolean(!("userId" in data))
}

const banCreate = (ws: WebSocket, data: unknown) => {
    if (!isBanPayload(data)) {
        ws.logger.debug("[WebSocket] Invalid banCreate Payload");
    }

    return ws.logger.debug(data);
}

export { banCreate }
