interface Channels {
    AllowedMentions: number;
    ChannelId: string;
    Children: string[];
    Description: string;
    GuildId: string;
    Name: string;
    Nsfw: boolean;
    ParentId: string;
    PermissionsOverrides: string[];
    Position: number;
    Slowmode: number;
    Type: number;
}

export default Channels;
