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

import type FlagFields from '../Utils/Classes/BitFields/Flags';
import type RequestUtils from '../Utils/Classes/RequestUtils';
import type { User } from '../Utils/Cql/Types';

export interface ExpressUser {
	Bot: boolean;
	Email: string;
	FlagsUtil: FlagFields;
	Id: string;
	Password: string;
	Token: string;
}

export type ExpressMethodCap = 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT';

declare global {
	namespace Express {
		interface Request {
			clientIp: string;
			fourohfourit(): true;
			methodi: ExpressMethodCap;
			user: ExpressUser;
			utils: RequestUtils;
		}
	}
}
