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

import crypto from 'node:crypto';
import { Snowflake as SnowflakeBuilder, Base64 } from '@kastelll/util';
import { Encryption } from '../../Config.js';
import Constants from '../../Constants.js';
import App from './App.js';

const Snowflake = new SnowflakeBuilder(Constants.Snowflake);

class LinkGeneration {
	public static VerifcationLink(snowflakeId: string): string {
		const CurrentDate = Date.now();

		const nonce = Base64.OldBase64(crypto.randomBytes(16).toString('base64'));
		const snowflake = Base64.Encode(snowflakeId);

		const hmac = crypto.createHmac('sha256', Encryption.TokenKey);

		hmac.update(`${snowflake}.${CurrentDate}.${nonce}`);

		const Secret = Base64.OldBase64(hmac.digest('base64'));

		return Base64.Encode(`${snowflake}.${Base64.Encode(String(CurrentDate))}.${nonce}.${Secret}`);
	}

	public static Verify(link: string): boolean {
		const DecodedLink = Base64.Decode(link);

		const [base64snowflake, base64createdDate, nonce, secret] = DecodedLink.split('.');

		if (!base64snowflake || !base64createdDate || !nonce || !secret) return false;

		const snowflake = Base64.Decode(base64snowflake);
		const CreatedDate = Base64.Decode(base64createdDate);

		App.StaticLogger.debug('Snowflake', snowflake);

		if (!Snowflake.Validate(snowflake)) return false;

		App.StaticLogger.debug('Snowflake good');

		const CreatedDateParsed = new Date(CreatedDate);

		// the max age of these will be around 2 weeks (MAX) so just hard code the check here
		if (CreatedDateParsed.getTime() + 1_209_600_000 < Date.now()) return false;

		App.StaticLogger.debug('Date good');

		const hmac = crypto.createHmac('sha256', Encryption.TokenKey);

		hmac.update(`${base64snowflake}.${base64createdDate}.${nonce}`);

		const Newsecret = Base64.OldBase64(hmac.digest('base64'));

		App.StaticLogger.debug('New Secret', Newsecret);
		App.StaticLogger.debug('Old Secret', secret);

		if (Newsecret !== secret) return false;

		App.StaticLogger.debug('New vs Old = Yes');

		if (link !== Base64.Encode(`${base64snowflake}.${base64createdDate}.${nonce}.${secret}`)) return false;

		App.StaticLogger.debug('Verified Link');

		return true;
	}

	public static GetSnowflake(link: string): string | null {
		const DecodedLink = Base64.Decode(link);

		const [base64snowflake, base64createdDate, nonce, secret] = DecodedLink.split('.');

		if (!base64snowflake || !base64createdDate || !nonce || !secret) return null;

		const snowflake = Base64.Decode(base64snowflake);

		if (!Snowflake.Validate(snowflake)) return null;

		return snowflake;
	}
}

export { LinkGeneration };

export default LinkGeneration;
