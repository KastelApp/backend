import { opCodes } from "@/Utils/Classes/Events/OpCodes.ts";
import type WebSocket from "../../../WebSocket";
import type { MessageCreate } from "../../Types/message/create";

const isMessagePayload = (data: unknown): data is MessageCreate => {
	if (typeof data !== "object" || data === null || data === undefined) return false;

	if (!("channelId" in data) || !("message" in data)) return false;

	if (typeof data.message !== "object" || data.message === null || data.message === undefined) return false;

	return !(
		!("id" in data.message) ||
		!("author" in data.message) ||
		!("content" in data.message) ||
		!("creationDate" in data.message)
	);
};

const messageCreate = (ws: WebSocket, data: unknown) => {
	if (!isMessagePayload(data)) {
		ws.logger.debug("Invalid messageCreate Payload");

		return;
	}

	ws.publish(`channel:messages:${data.channelId}`, {
		op: opCodes.event,
		event: "MessageCreate",
		data: {
			id: data.message.id,
			channelId: data.channelId,
			author: {
				id: data.message.author.id,
				username: data.message.author.username,
				globalNickname: data.message.author.globalNickname,
				tag: data.message.author.tag,
				avatar: data.message.author.avatar,
				publicFlags: data.message.author.publicFlags,
				flags: data.message.author.flags,
			},
			content: data.message.content,
			creationDate: data.message.creationDate,
			editedDate: data.message.editedDate,
			embeds: data.message.embeds,
			nonce: data.message.nonce,
			replyingTo: data.message.replyingTo,
			attachments: data.message.attachments,
			flags: data.message.flags,
			allowedMentions: data.message.allowedMentions,
			mentions: data.message.mentions,
			pinned: data.message.pinned,
			deletable: data.message.deletable,
		},
	});
};

export { messageCreate };
