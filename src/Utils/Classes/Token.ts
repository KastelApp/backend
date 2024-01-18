import { Buffer } from "node:buffer";
import crypto from "node:crypto";
import App from "./App.ts";

class Token {
	public static generateToken(UserId: string): string {
		const snowflakeBase64 = this.Encode(UserId);
		const nonce = crypto.randomBytes(16).toString("base64url");

		const stringDated = this.Encode(String(Date.now()) + nonce);

		const hmac = crypto.createHmac("sha256", App.config.encryption.tokenKey);

		hmac.update(`${snowflakeBase64}.${stringDated}`);

		return `${snowflakeBase64}.${stringDated}.${hmac.digest("base64url")}`;
	}

	public static ValidateToken(Token: string): boolean {
		const [snowflakeBase64, stringDated, hmacSignature] = Token.split(".");

		if (!snowflakeBase64 || !stringDated || !hmacSignature) return false;

		const hmac = crypto.createHmac("sha256", App.config.encryption.tokenKey);

		hmac.update(`${snowflakeBase64}.${stringDated}`);

		return hmac.digest("base64url") === hmacSignature;
	}

	public static DecodeToken(Token: string): {
		Snowflake: string;
		Timestamp: number;
	} {
		const [snowflakeBase64, stringDated] = Token.split(".");

		if (!snowflakeBase64 || !stringDated) throw new Error("Invalid token provided.");

		const snowflake = Buffer.from(snowflakeBase64, "base64url").toString("utf8");

		const decodedTimestamp = Buffer.from(stringDated, "base64url").toString("utf8");

		return { Snowflake: snowflake, Timestamp: Number.parseInt(decodedTimestamp, 10) };
	}

	private static Encode(item: string) {
		return Buffer.from(item, "utf8").toString("base64url");
	}
}

export default Token;

export { Token };
