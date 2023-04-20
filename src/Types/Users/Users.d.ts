/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

import FlagFields from "../../Utils/Classes/BitFields/Flags";

export interface LessUser { // Less user is just less data but important data
    Id: string;
    AvatarHash: string;
    Email: string;
    EmailVerified: boolean;
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
    Bot: boolean;
    FlagsUtil: FlagFields
}

export interface RawUser {
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

interface IPopulatedUserWJ {
    toJSON(): RawUser
    toObject(): RawUser
} 

export type PopulatedUserWJ = RawUser & IPopulatedUserWJ;

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