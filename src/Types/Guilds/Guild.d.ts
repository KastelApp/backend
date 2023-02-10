export interface Guild {
    _id: string;
    Name: string;
    Description: string;
    Flags: number;
    Owner: string;
    CoOwners: string[];
    Channels: string[];
    Roles: string[];
    Invites: string[];
    Bans: string[];
    Members: string[];
    Emojis: string[];
    MaxMembers: number;
}