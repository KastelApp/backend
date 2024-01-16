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

import type { Server } from "bun";

export type IPHeaders =
	| "appengine-user-ip"
	| "cf-connecting-ip"
	| "cf-pseudo-ipv4"
	| "fastly-client-ip"
	| "forwarded-for"
	| "forwarded"
	| "true-client-ip"
	| "x-client-ip"
	| "x-cluster-client-ip"
	| "x-forwarded"
	| "x-forwarded"
	| "x-real-ip"
	| (string & {});

export const headersToCheck: IPHeaders[] = [
	"x-real-ip", // Nginx proxy/FastCGI
	"x-client-ip", // Apache https://httpd.apache.org/docs/2.4/mod/mod_remoteip.html#page-header
	"cf-connecting-ip", // Cloudflare
	"fastly-client-ip", // Fastly
	"x-cluster-client-ip", // GCP
	"x-forwarded", // General Forwarded
	"forwarded-for", // RFC 7239
	"forwarded", // RFC 7239
	"x-forwarded", // RFC 7239
	"appengine-user-ip", // GCP
	"true-client-ip", // Akamai and Cloudflare
	"cf-pseudo-ipv4", // Cloudflare
];
class IpUtils {
	public static isLocalIp(ip: string): boolean {
		return ip === "::1" || ip === "127.0.0.1" || ip === "localhost";
	}

	public static getIp(req: Request, server: Server | null) {
		const rqIp = server?.requestIP(req)?.address;

		if (req.headers.get("x-forwarded-for")) return req.headers.get("x-forwarded-for")?.split(",")[0];

		let clientIp: string | null | undefined = null;

		for (const header of headersToCheck) {
			clientIp = req.headers.get(header);

			if (clientIp) break;
		}

		if (!clientIp) {
			if (rqIp) return rqIp;

			return null;
		}

		return clientIp;
	}
}

export default IpUtils;

export { IpUtils };
