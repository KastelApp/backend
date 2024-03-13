import type { types } from "@kastelapp/cassandra-driver";

export interface MessageReported {
    channelId: string;
    guildId: string;
    messageId: types.Long | bigint | string;
}

export default MessageReported;
