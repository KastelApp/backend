import type { types } from "@kastelll/cassandra-driver";

export interface GuildMemberUpdate {
    flags: number;
    guildId: string;
    guildMemberId: types.Long | string;
    joinedAt: Date;
    nickname: string | null;
    roles: string[];
    timeouts: {};
    user: {};
}

export default GuildMemberUpdate;
