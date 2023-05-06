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

import type { Snowflake, Turnstile, CacheManager } from '@kastelll/util';
import type Emails from '../Utils/Classes/Emails';
import type UserUtils from '../Utils/Classes/MiscUtils/User';
import type Utils from '../Utils/Classes/MiscUtils/Utils';
import type RequestUtils from '../Utils/Classes/RequestUtils';
import type SystemSocket from '../Utils/Classes/System/SystemSocket';
import type { LessUser } from './Users/Users';

declare global {
	namespace Express {
		interface Request {
			NoReply: Emails | null;
			Support: Emails | null;
			captcha: Turnstile;
			clientIp: string;
			mutils: Utils;
			user: LessUser;
			utils: RequestUtils;
		}

		interface Application {
			cache: CacheManager;
			ready: boolean;
			snowflake: Snowflake;
			socket: SystemSocket;
		}
	}
}
