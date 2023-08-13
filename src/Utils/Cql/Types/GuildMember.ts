interface GuildMembersTimeouts {
    ChannelId: string;
    TimeoutUntil: Date;
}

interface GuildMembers {
    Flags: number;
    GuildId: string;
    JoinedAt: Date;
    Nickname: string;
    Roles: string[];
    Timeouts: GuildMembersTimeouts[];
    UserId: string;
}

export default GuildMembers;

export type { GuildMembers, GuildMembersTimeouts };
