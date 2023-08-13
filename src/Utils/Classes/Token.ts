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

import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import { Base64 } from '@kastelll/util';
import { Encryption } from '../../Config.js';

class Token {
	public static GenerateToken(UserId: string): string {
		const snowflakeBase64 = Base64.Encode(UserId);
		const nonce = crypto
			.randomBytes(16)
			.toString('base64')
			.replaceAll('+', 'F')
			.replaceAll('/', 'q')
			.replace(/=+$/, 'zT');

		const StringDated = Base64.Encode(String(Date.now()) + nonce);

		const hmac = crypto.createHmac('sha256', Encryption.JwtKey);

		hmac.update(`${snowflakeBase64}.${StringDated}`);

		return `${snowflakeBase64}.${StringDated}.${hmac
			.digest('base64')
			.replaceAll('+', 'F')
			.replaceAll('/', 'q')
			.replace(/=+$/, 'zT')}`;
	}

	public static ValidateToken(Token: string): boolean {
		const [snowflakeBase64, StringDated, hmacSignature] = Token.split('.');

		if (!snowflakeBase64 || !StringDated || !hmacSignature) return false;

		const hmac = crypto.createHmac('sha256', Encryption.JwtKey);

		hmac.update(`${snowflakeBase64}.${StringDated}`);

		return hmac.digest('base64').replaceAll('+', 'F').replaceAll('/', 'q').replace(/=+$/, 'zT') === hmacSignature;
	}

	public static DecodeToken(Token: string): {
		Snowflake: string;
		Timestamp: number;
	} {
		const [snowflakeBase64, StringDated] = Token.split('.');

		if (!snowflakeBase64 || !StringDated) throw new Error('Invalid token provided.');

		const Snowflake = Buffer.from(
			snowflakeBase64.replaceAll('F', '+').replaceAll('q', '/').replace(/zT/, '='),
			'base64',
		).toString('utf8');

		const DecodedTimestamp = Buffer.from(
			StringDated.replaceAll('F', '+').replaceAll('q', '/').replace(/zT/, '='),
			'base64',
		).toString('utf8');

		return { Snowflake, Timestamp: Number.parseInt(DecodedTimestamp, 10) };
	}
}

export default Token;

export { Token };
