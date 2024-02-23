import type { types } from "@kastelll/cassandra-driver";

export interface MessageDelete {
    channelId: string;
    guildId: string;
    messageId: types.Long | bigint;
}

export default MessageDelete;
