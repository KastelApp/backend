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

import type { Turnstile } from "@kastelll/util";
import type FlagFields from "../Utils/Classes/BitFields/Flags";
import type GuildMemberFlags from "../Utils/Classes/BitFields/GuildMember";
import type { GuildMembersTimeouts } from "../Utils/Cql/Types/GuildMember";
import type PermissionsOverrides from "../Utils/Cql/Types/PermissionsOverides";

export interface ExpressUser {
	Bot: boolean;
	Email: string;
	FlagsUtil: FlagFields;
	Guilds: string[];
	Id: string;
	Password: string;
	Token: string;
}

export interface EditedGuildMember {
	Flags: GuildMemberFlags;
	GuildId: string;
	JoinedAt: Date;
	Nickname: string;
	Roles: string[];
	Timeouts: GuildMembersTimeouts[];
	UserId: string;
}

export interface Guild {
	Guild: {
		Features: string[];
		Id: string;
		Name: string;
		OwnerId: string;
	};
	GuildMember: EditedGuildMember;
}

export interface Channel {
	GuildId: string;
	Id: string;
	Name: string;
	ParentId: string;
	PermissionOverrides: PermissionsOverrides[];
	Position: number;
	Topic: string;
	Type: number;
}

export type ExpressMethodCap = "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT";

declare global {
	namespace Express {
		interface Request {
			captcha: Turnstile;
			channel: Channel;
			clientIp: string;
			fourohfourit(): true;
			guild: Guild;
			methodi: ExpressMethodCap;
			user: ExpressUser;
		}
	}
}
