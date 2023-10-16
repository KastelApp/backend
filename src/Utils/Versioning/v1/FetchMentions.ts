// channels are <#id>
// roles are <@&id>
// users are <@!?id>

export const FetchMentions = (content: string): {
    Channels: string[];
    Roles: string[];
    Users: string[];
} => {
    // eslint-disable-next-line prefer-named-capture-group
    const Regex = /<#(\d+)>|<@&(\d+)>|<@!?(\d+)>/g;
    
    const Channels: string[] = [];
    const Roles: string[] = [];
    const Users: string[] = [];
    
    let Match: RegExpExecArray | null;
    
    while ((Match = Regex.exec(content)) !== null) {
        if (Match[1]) {
            Channels.push(Match[1]);
        } else if (Match[2]) {
            Roles.push(Match[2]);
        } else if (Match[3]) {
            Users.push(Match[3]);
        }
    }
    
    return {
        Channels: [...new Set(Channels)],
        Roles: [...new Set(Roles)],
        Users: [...new Set(Users)],
    };    
};
