export interface GuildMemberAdd {
	guildId: string;
	member: {
		flags: number;
		joinedAt: string;
		nickname: string | null;
		owner: boolean,
		roles: string[];
		userId: string;
	};
	userId: string;
}
