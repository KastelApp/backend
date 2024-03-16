import type WebSocket from "../../../WebSocket";
import type { SessionDelete } from "../../Types/session/delete";

const isSessionsPayload = (data: unknown): data is SessionDelete => {
	if (typeof data !== "object" || data === null || data === undefined) return false;

	if (!("sessionId" in data)) return false;
	return Boolean(!("userId" in data));
};

const sessionDelete = (ws: WebSocket, data: unknown) => {
	if (!isSessionsPayload(data)) {
		ws.logger.debug("Invalid sessionDelete Payload");
	}

	return ws.logger.debug(data);
};

export { sessionDelete };
