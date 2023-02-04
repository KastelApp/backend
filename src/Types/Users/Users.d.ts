export interface LessUser { // Less user is just less data but important data
    id: string;
    AvatarHash: string;
    Email: string;
    Username: string;
    Tag: string;
    TwoFa: boolean;
    TwoFaVerified: boolean;
    Flags: number;
    Password: string; // the hashed version of the password
    Banned: boolean;
    BannedReason: string;
    Locked: boolean;
    AccountDeletionInProgress: boolean;
    Token: string;
}

export interface PopulatedUser {
    toJSON(): any;
    _id: string,
    Email: string,
    EmailVerified: boolean,
    Username: string,
    Tag: string,
    AvatarHash: string | null,
    Password: string | null,
    PhoneNumber: string | null,
    TwoFa: boolean,
    TwoFaVerified: boolean,
    TwoFaSecret: string | null,
    Ips: string[],
    Flags: number,
    Guilds: string[],
    Dms: string[],
    GroupChats: string[],
    Bots: string[],
    Banned: boolean,
    BanReason: string | null,
    Locked: boolean,
    AccountDeletionInProgress: boolean,
    __v: number
}

export interface UserAtMe {
    id: string;
    Email: string;
    EmailVerified: boolean;
    Username: string;
    Tag: string;
    AvatarHash: string | null;
    PhoneNumber: string | null;
    TwoFa: boolean;
    TwoFaVerified: boolean;
    PublicFlags: number;
}