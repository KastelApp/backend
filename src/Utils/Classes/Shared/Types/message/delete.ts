import type { types } from "@kastelapp/cassandra-driver";

export interface MessageDelete {
	channelId: string;
	guildId: string;
	messageId: types.Long | bigint | string;
}

export default MessageDelete;
