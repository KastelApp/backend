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
		// Encode the snowflake identifier to base64
		const snowflakeBase64 = Base64.Encode(UserId);
		// Generate a nonce (random value)
		const nonce = crypto
			.randomBytes(16)
			.toString('base64')
			.replaceAll('+', 'F')
			.replaceAll('/', 'q')
			.replace(/=+$/, 'zT');

		// Encode the current timestamp with the nonce
		const StringDated = Base64.Encode(String(Date.now()) + nonce);

		// Create a HMAC (hash-based message authentication code) object with sha256 algorithm
		const hmac = crypto.createHmac('sha256', Encryption.JwtKey);

		// Update the HMAC with the snowflake identifier and timestamp
		hmac.update(`${snowflakeBase64}.${StringDated}`);

		// Return the token composed of the snowflake identifier, timestamp, and HMAC signature (also in base64)
		return `${snowflakeBase64}.${StringDated}.${hmac
			.digest('base64')
			.replaceAll('+', 'F')
			.replaceAll('/', 'q')
			.replace(/=+$/, 'zT')}`;
	}

	public static ValidateToken(Token: string): boolean {
		// Split the token into the snowflake identifier, timestamp, and HMAC signature
		const [snowflakeBase64, StringDated, hmacSignature] = Token.split('.');

		if (!snowflakeBase64 || !StringDated || !hmacSignature) return false;

		// Create a HMAC object with sha256 algorithm
		const hmac = crypto.createHmac('sha256', Encryption.JwtKey);

		// Update the HMAC with the snowflake identifier and timestamp
		hmac.update(`${snowflakeBase64}.${StringDated}`);

		// Compare the HMAC signature from the token with the newly generated HMAC signature
		return hmac.digest('base64').replaceAll('+', 'F').replaceAll('/', 'q').replace(/=+$/, 'zT') === hmacSignature;
	}

	public static DecodeToken(Token: string): {
		Snowflake: string;
		Timestamp: number;
	} {
		// Split the token into the snowflake identifier and timestamp
		const [snowflakeBase64, StringDated] = Token.split('.');

		if (!snowflakeBase64 || !StringDated) throw new Error('Invalid token provided.');

		// Decode the snowflake identifier from base64
		// Decode the snowflake portion of the token back to its original format
		const Snowflake = Buffer.from(
			snowflakeBase64.replaceAll('F', '+').replaceAll('q', '/').replace(/zT/, '='),
			'base64',
		).toString('utf8');

		// Decode the timestamp portion of the token back to its original format
		const DecodedTimestamp = Buffer.from(
			StringDated.replaceAll('F', '+').replaceAll('q', '/').replace(/zT/, '='),
			'base64',
		).toString('utf8');

		// Return an object containing the decoded snowflake and timestamp values
		return { Snowflake, Timestamp: Number.parseInt(DecodedTimestamp, 10) };
	}
}

export default Token;

export { Token };
