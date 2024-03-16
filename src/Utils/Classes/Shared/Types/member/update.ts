import type { types } from "@kastelapp/cassandra-driver";

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
