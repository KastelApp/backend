import type { types } from "@kastelll/cassandra-driver";

export interface MessageUpdated {
    allowedMentions: number;
    attachments: string[];
    authorId: string;
    bucket: string;
    channelId: string;
    content: string;
    embeds: {}[];
    flags: number;
    guildId: string;
    member: {};
    mentionChannels: string[];
    mentionRoles: string[];
    mentions: string[];
    messageId: types.Long | bigint;
    replyingTo: string | null;
    updatedDate: Date | null;
}

export default MessageUpdated;
