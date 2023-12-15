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

import type { Request } from "express";
import { Server } from "../../Config.ts";

class IpUtils {
	public static GetIp(req: Request): string {
		const normalIps = req.headers["cf-connecting-ip"] ?? req.headers["x-forwarded-for"] ?? req.socket.remoteAddress;

		let Ip = req.headers["cf-true-ip"] ?? normalIps;

		if (typeof Ip === "string") {
			Ip = Ip.split(",")[0];
		}

		return (Ip as string)?.replace("::ffff:", "") ?? "127.0.0.1";
	}

	public static IsLocalIp(ip: string): boolean {
		return ip === "::1" || ip === "127.0.0.1" || ip === "localhost";
	}

	public static async isCloudflareIp(ip: string | undefined): Promise<boolean> {
		try {
			if (!ip) return false;

			// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires -- Require & Imports work together due to Bun.
			const whois = require("whois-json");

			const results = await whois(ip.replace("::ffff:", ""));

			return (
				(results && results.orgName === "Cloudflare, Inc.") ||
				results.orgName === "CLOUDFLARENET" ||
				results.orgName?.toLowerCase()?.includes("cloudflare") ||
				results.netname?.toLowerCase()?.includes("cloudflare") ||
				false
			);
		} catch {
			if (Server.CloudflareAccessOnly) {
				throw new Error("CloudflareAccessOnly is enabled but the whois-json package is not installed");
			}
		}

		return false;
	}
}

export default IpUtils;

export { IpUtils };
