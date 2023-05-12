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

import Encryption from './Encryption.js';

// NOTE: Please PLEASE do not use this vanilla token system, Please create your own token system, this is just a example
// This is very insecure, and should not be used in production

class Token  {
	public static GenerateToken(UserId: string): string {
		return Encryption.encrypt(UserId);
	}

	public static ValidateToken(Token: string): boolean {
		return Encryption.decrypt(Token);
	}

	public static DecodeToken(Token: string): {
		Snowflake: string;
		Timestamp: number;
	} {
		return {
			Snowflake: Encryption.decrypt(Token),
			Timestamp: Date.now(),
		};
	}
};

export default Token;

export { Token };
