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
		const snowflakeBase64 = this.Encode(UserId);
		const nonce = crypto.randomBytes(16).toString("base64url");

		const StringDated = this.Encode(String(Date.now()) + nonce);

		const hmac = crypto.createHmac("sha256", Encryption.TokenKey);

		hmac.update(`${snowflakeBase64}.${StringDated}`);

		return `${snowflakeBase64}.${StringDated}.${hmac.digest("base64url")}`;
	}

	public static ValidateToken(Token: string): boolean {
		const [snowflakeBase64, StringDated, hmacSignature] = Token.split(".");

		if (!snowflakeBase64 || !StringDated || !hmacSignature) return false;

		const hmac = crypto.createHmac("sha256", Encryption.TokenKey);

		hmac.update(`${snowflakeBase64}.${StringDated}`);

		return hmac.digest("base64url") === hmacSignature;
	}

	public static DecodeToken(Token: string): {
		Snowflake: string;
		Timestamp: number;
	} {
		const [snowflakeBase64, StringDated] = Token.split(".");

		if (!snowflakeBase64 || !StringDated) throw new Error("Invalid token provided.");

		const Snowflake = Buffer.from(snowflakeBase64, "base64url").toString("utf8");

		const DecodedTimestamp = Buffer.from(StringDated, "base64url").toString("utf8");

		return { Snowflake, Timestamp: Number.parseInt(DecodedTimestamp, 10) };
	}

	private static Encode(item: string) {
		return Buffer.from(item, "utf8").toString("base64url");
	}
}

export default Token;

export { Token };
