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

import type { Request } from 'express';

class IpUtils {
	public static GetIp(req: Request): string {
		let Ip: string[] | string | undefined = req.headers['cf-connecting-ip'] ?? req.headers['x-forwarded-for'] ?? req.socket.remoteAddress;

		if (typeof Ip === 'string') {
			Ip = Ip.split(',')[0];
		}

		return (Ip as string)?.replace('::ffff:', '') ?? '127.0.0.1';
	}

	public static IsLocalIp(ip: string): boolean {
		return ip === '::1' || ip === '127.0.0.1' || ip === 'localhost';
	}
}

export default IpUtils;

export { IpUtils };
