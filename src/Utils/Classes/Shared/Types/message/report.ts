import type { types } from "@kastelll/cassandra-driver";

export interface MessageReported {
    channelId: string;
    guildId: string;
    messageId: types.Long | bigint;
}

export default MessageReported;
