import type WebSocket from "../../../WebSocket";
import type { SessionCreate } from "../../Types/session/create";

const isSessionsPayload = (data: unknown): data is SessionCreate => {
    if (typeof data !== "object" || data === null || data === undefined) return false;

    if (!("sessionId" in data)) return false;
    return Boolean(!("userId" in data));
}

const sessionCreate = (ws: WebSocket, data: unknown) => {
    if (!isSessionsPayload(data)) {
        ws.logger.debug("[WebSocket] Invalid sessionCreate Payload");
    }

    return ws.logger.debug(data);
}

export { sessionCreate }
