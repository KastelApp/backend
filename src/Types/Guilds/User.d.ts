interface RawGuildMember {
    _id: string
    Guild: string
    User?: RawUser
    Roles: string[]
    JoinedAt: number
    Flags: number
    __v: number
}

interface RawChannel {
    _id: string
    Guild: string
    Name: string
    Description: string
    Type: number
    AllowedMentions: number
    Parent: string
    Children: string[]
    Position: number
    PermissionsOverides: any[]
    __v: number
}

interface RawRole {
    _id: string
    Guild: string
    Name: string
    Deleteable: boolean
    AllowedMentions: number
    Hoisted: boolean
    Permissions: string
    Position: number
    __v: number
}

interface RawUser {
    _id: string
    Email: string
    EmailVerified: boolean
    Username: string
    Tag: string
    AvatarHash: null
    Password: string
    PhoneNumber: null
    TwoFa: boolean
    TwoFaVerified: boolean
    TwoFaSecret: null
    Ips: any[]
    Flags: number
    Dms: any[]
    GroupChats: any[]
    Bots: any[]
    Banned: boolean
    BanReason: null
    Locked: boolean
    AccountDeletionInProgress: boolean
    __v: number
    Guilds: string[]
}

export interface GuildPermissions {
    _id: string;
    Name: string;
    Description: string;
    Flags: number;
    Owner: string;
    CoOwners: string[];
    Channels?: RawChannel[];
    Roles?: RawRole[];
    Invites: string[];
    Bans: string[];
    Members?: RawGuildMember[];
    Emojis: string[];
    MaxMembers: number;
    __v: number;
}
