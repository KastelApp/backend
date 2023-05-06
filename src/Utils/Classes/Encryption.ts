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
import { Encryption as En } from '../../Config.js';

const algorithm = En.Algorithm;
const initVector = En.InitVector;
const securityKey = En.SecurityKey;

class Encryption {
	public static encrypt(data: string): string {
		try {
			const cipher = crypto.createCipheriv(algorithm, securityKey, initVector);

			const dd = {
				data,
			};

			return cipher.update(Encryption.fixData(dd), 'utf8', 'hex') + cipher.final('hex');
		} catch (error) {
			throw new Error(`Failed to encrypt\n${error}`);
		}
	}

	public static decrypt(data: string, raw = false): any {
		try {
			const decipher = crypto.createDecipheriv(algorithm, securityKey, initVector);
			const decrypted = decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
			const cleaned = Encryption.cleanData(decrypted);

			if (raw) return cleaned;

			return cleaned.data;
		} catch (error: any) {
			throw new Error(`Failed to decrypt (${error.message})`);
		}
	}

	public static isEncrypted(item: string): boolean {
		try {
			Encryption.decrypt(item);

			return true;
		} catch {
			return false;
		}
	}

	private static fixData(data: any): string {
		let fixedData = data;

		if (typeof data === 'object') fixedData = JSON.stringify(data);

		if (typeof data === 'undefined') fixedData = '';

		if (typeof data !== 'string') fixedData = String(data);

		if (typeof data !== 'string') throw new Error(`Failed to stringify data ${typeof data}, ${data}`);

		return fixedData;
	}

	private static cleanData(data: string): any {
		try {
			return JSON.parse(data);
		} catch {
			return data;
		}
	}

	public static completeDecryption(items: any, raw = false): any {
		const decrypt = (item: string) => Encryption.decrypt(item, raw);
		const completeDecrypt = (item: string) => Encryption.completeDecryption(item, raw);
		const isEncrypted = Encryption.isEncrypted;

		if (typeof items === 'undefined') {
			return null;
		}

		if (typeof items === 'string') {
			return decrypt(items);
		}

		if (Array.isArray(items)) {
			const newArray: any[] = [];

			for (const item of items) {
				if (
					item == true ||
					item == false ||
					item == null ||
					typeof item === 'number' ||
					(typeof item === 'object' ? item instanceof Date : false)
				) {
					newArray.push(item);
					continue;
				}

				if (typeof item === 'object') {
					newArray.push(completeDecrypt(item));
				} else if (isEncrypted(item)) {
					newArray.push(completeDecrypt(item));
				} else {
					newArray.push(item);
				}
			}

			return newArray;
		} else if (typeof items === 'object' && !Array.isArray(items)) {
			const newObject: {
				[key: string]: any;
			} = {};

			for (const i in items) {
				const item = items[i];

				if (
					item == true ||
					item == false ||
					item == null ||
					typeof item === 'number' ||
					(typeof item === 'object' ? item instanceof Date : false)
				) {
					newObject[i] = item;
					continue;
				}

				const encrypted = isEncrypted(item);

				if (typeof item === 'object') {
					newObject[i] = completeDecrypt(item);
				} else if (encrypted) {
					newObject[i] = completeDecrypt(item);
				} else {
					newObject[i] = item;
				}
			}

			return newObject;
		}
	}

	public static completeEncryption(items: any): any {
		const encrypt = Encryption.encrypt;
		const completeEncrypt = Encryption.completeEncryption;
		const isEncrypted = Encryption.isEncrypted;

		if (typeof items === 'undefined') {
			return null;
		}

		if (typeof items === 'string') {
			return encrypt(items);
		}

		if (items instanceof Date) {
			const numberedDate = items.getTime();
			return encrypt(String(numberedDate));
		}

		if (Array.isArray(items)) {
			const newArray: any[] = [];

			for (const item of items) {
				if (
					item == true ||
					item == false ||
					item == null ||
					typeof item === 'number' ||
					(typeof item === 'object' ? item instanceof Date : false)
				) {
					newArray.push(item);
					continue;
				}

				if (!isEncrypted(item)) {
					newArray.push(completeEncrypt(item));
				} else {
					newArray.push(completeEncrypt(item));
				}
			}

			return newArray;
		} else if (typeof items === 'object' && !Array.isArray(items)) {
			const newObject: {
				[key: string]: any;
			} = {};

			for (const i in items) {
				const item = items[i];

				const encrypted = isEncrypted(item);

				if (!encrypted) {
					if (
						item == true ||
						item == false ||
						item == null ||
						typeof item === 'number' ||
						(typeof item === 'object' ? item instanceof Date : false)
					) {
						newObject[i] = item;
						continue;
					} else {
						newObject[i] = completeEncrypt(item);
					}
				} else {
					newObject[i] = completeEncrypt(item);
				}
			}

			return newObject;
		}
	}
}

export default Encryption;

export { Encryption };
