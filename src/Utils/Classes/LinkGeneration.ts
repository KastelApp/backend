import crypto from "node:crypto";
import { Snowflake as SnowflakeBuilder, Base64 } from "@kastelll/util";
import Constants from "../../Constants.ts";
import App from "./App.ts";

// todo: refactor this

const snowflake = new SnowflakeBuilder(Constants.snowflake);

class LinkGeneration {
	public static VerifcationLink(snowflakeId: string): string {
		const currentDate = Date.now();

		const nonce = Base64.OldBase64(crypto.randomBytes(16).toString("base64"));
		const snowflake = Base64.Encode(snowflakeId);

		const hmac = crypto.createHmac("sha256", App.config.encryption.tokenKey);

		hmac.update(`${snowflake}.${currentDate}.${nonce}`);

		const secret = Base64.OldBase64(hmac.digest("base64"));

		return Base64.Encode(`${snowflake}.${Base64.Encode(String(currentDate))}.${nonce}.${secret}`);
	}

	public static Verify(link: string): boolean {
		const decodedLink = Base64.Decode(link);

		const [base64snowflake, base64createdDate, nonce, secret] = decodedLink.split(".");

		if (!base64snowflake || !base64createdDate || !nonce || !secret) return false;

		const decodedSnowflake = Base64.Decode(base64snowflake);
		const createdDate = Base64.Decode(base64createdDate);

		App.staticLogger.debug("Snowflake", decodedSnowflake);

		if (!snowflake.validate(decodedSnowflake)) return false;

		App.staticLogger.debug("Snowflake good");

		const createdDateParsed = new Date(createdDate);

		// the max age of these will be around 2 weeks (MAX) so just hard code the check here
		if (createdDateParsed.getTime() + 1_209_600_000 < Date.now()) return false;

		App.staticLogger.debug("Date good");

		const hmac = crypto.createHmac("sha256", App.config.encryption.tokenKey);

		hmac.update(`${base64snowflake}.${base64createdDate}.${nonce}`);

		const newsecret = Base64.OldBase64(hmac.digest("base64"));

		App.staticLogger.debug("New Secret", newsecret);
		App.staticLogger.debug("Old Secret", secret);

		if (newsecret !== secret) return false;

		App.staticLogger.debug("New vs Old = Yes");

		if (link !== Base64.Encode(`${base64snowflake}.${base64createdDate}.${nonce}.${secret}`)) return false;

		App.staticLogger.debug("Verified Link");

		return true;
	}

	public static GetSnowflake(link: string): string | null {
		const decodedLink = Base64.Decode(link);

		const [base64snowflake, base64createdDate, nonce, secret] = decodedLink.split(".");

		if (!base64snowflake || !base64createdDate || !nonce || !secret) return null;

		const decodedSnowflake = Base64.Decode(base64snowflake);

		if (!snowflake.validate(decodedSnowflake)) return null;

		return decodedSnowflake;
	}
}

export { LinkGeneration };

export default LinkGeneration;
