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

import type FlagFields from '../../Utils/Classes/BitFields/Flags.js';

export interface LessUser {
	Avatar: string;
	Bots: string[];
	Dms: string[];
	Email: string;
	Flags: string;
	GlobalNickname: string;
	Guilds: string[];
	Id: string;
	Ips: string[];
	Password: string;
	PhoneNumber: string;
	Tag: string;
	TwoFaSecret: string;
	Username: string;
}

export interface RawUser {
	Avatar: string;
	Bots: string[];
	Dms: string[];
	Email: string;
	Flags: string;
	GlobalNickname: string;
	Guilds: string[];
	Ips: string[];
	Password: string;
	PhoneNumber: string;
	Tag: string;
	TwoFaSecret: string;
	Username: string;
	_id: string;
}

interface IPopulatedUserWJ {
	toJSON(): RawUser;
	toObject(): RawUser;
}

export type PopulatedUserWJ = IPopulatedUserWJ & RawUser;

export interface UserAtMe {
	AvatarHash: string | null;
	Email: string;
	EmailVerified: boolean;
	PhoneNumber: string | null;
	PublicFlags: string;
	Tag: string;
	TwoFa: boolean;
	TwoFaVerified: boolean;
	Username: string;
	id: string;
}
