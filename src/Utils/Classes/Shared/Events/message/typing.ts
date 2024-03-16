import { opCodes } from "@/Utils/Classes/Events/OpCodes.ts";
import type WebSocket from "../../../WebSocket";
import type MessageTyping from "../../Types/message/typing.ts";

const isMessagePayload = (data: unknown): data is MessageTyping => {
	if (typeof data !== "object" || data === null || data === undefined) return false;

	return "channelId" in data && "userId" in data;
};

const messageTyping = (ws: WebSocket, data: unknown) => {
	if (!isMessagePayload(data)) {
		ws.logger.debug("Invalid messageTyping Payload");

		return;
	}

	ws.publish(`channel:messages:${data.channelId}:typing`, {
		op: opCodes.event,
		event: "Typing",
		data: {
			userId: data.userId,
			channelId: data.channelId,
		},
	});
};

export { messageTyping };
