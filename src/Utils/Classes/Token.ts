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

import { Buffer } from "node:buffer";
import crypto from "node:crypto";
import { Encryption } from "../../Config.ts";

class Token {
	public static GenerateToken(UserId: string): string {
		const SnowflakeBase64 = this.Encode(UserId);
		const Nonce = crypto.randomBytes(16).toString("base64url");

		const StringDated = this.Encode(String(Date.now()) + Nonce);

		const Hmac = crypto.createHmac("sha256", Encryption.TokenKey);

		Hmac.update(`${SnowflakeBase64}.${StringDated}`);

		return `${SnowflakeBase64}.${StringDated}.${Hmac.digest("base64url")}`;
	}

	public static ValidateToken(Token: string): boolean {
		const [SnowflakeBase64, StringDated, HmacSignature] = Token.split(".");

		if (!SnowflakeBase64 || !StringDated || !HmacSignature) return false;

		const Hmac = crypto.createHmac("sha256", Encryption.TokenKey);

		Hmac.update(`${SnowflakeBase64}.${StringDated}`);

		return Hmac.digest("base64url") === HmacSignature;
	}

	public static DecodeToken(Token: string): {
		Snowflake: string;
		Timestamp: number;
	} {
		const [SnowflakeBase64, StringDated] = Token.split(".");

		if (!SnowflakeBase64 || !StringDated) throw new Error("Invalid token provided.");

		const Snowflake = Buffer.from(SnowflakeBase64, "base64url").toString("utf8");

		const DecodedTimestamp = Buffer.from(StringDated, "base64url").toString("utf8");

		return { Snowflake, Timestamp: Number.parseInt(DecodedTimestamp, 10) };
	}

	private static Encode(item: string) {
		return Buffer.from(item, "utf8").toString("base64url");
	}
}

export default Token;

export { Token };
