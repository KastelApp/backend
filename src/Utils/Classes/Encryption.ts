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

		if (typeof fixedData === 'object') fixedData = JSON.stringify(data);

		if (typeof fixedData === 'undefined') fixedData = '';

		if (typeof fixedData !== 'string') fixedData = String(data);

		if (typeof fixedData !== 'string') throw new Error(`Failed to stringify data ${typeof fixedData}, ${fixedData}`);

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
		const completeDecrypt = (item: any) => Encryption.completeDecryption(item, raw);
		const isEncrypted = Encryption.isEncrypted;

		if (typeof items === 'object') {
			if (Array.isArray(items)) {
				const NewArray: any[] = [];

				for (const item of items) {
					if (!item || item === null) {
						NewArray.push(item);

						continue;
					}

					if (typeof item === 'object') {
						NewArray.push(completeDecrypt(item));
					} else if (item instanceof Date) {
						NewArray.push(item);
					} else if (typeof item === 'string' && isEncrypted(item)) {
						NewArray.push(decrypt(item));
					} else {
						NewArray.push(item);
					}
				}

				console.log(NewArray);

				return NewArray;
			} else {
				const NewObject: any = {};

				for (const [key, item] of Object.entries(items)) {
					if (!item || item === null) {
						NewObject[key] = item;

						continue;
					}

					if (typeof item === 'object') {
						NewObject[key] = completeDecrypt(item);
					} else if (item instanceof Date) {
						NewObject[key] = item;
					} else if (typeof item === 'string' && isEncrypted(item)) {
						NewObject[key] = decrypt(item);
					} else {
						NewObject[key] = item;
					}
				}

				console.log(NewObject);

				return NewObject;
			}
		} else if (typeof items === 'string' && isEncrypted(items)) {
			return decrypt(items);
		} else {
			return items;
		}
	}

	public static completeEncryption(items: any): any {
		const encrypt = Encryption.encrypt;
		const completeEncrypt = Encryption.completeEncryption;
		const isEncrypted = Encryption.isEncrypted;

		if (typeof items === 'object') {
			if (Array.isArray(items)) {
				const NewArray: any[] = [];

				for (const item of items) {
					if (!item || item === null) {
						NewArray.push(item);

						continue;
					}

					if (typeof item === 'object') {
						NewArray.push(completeEncrypt(item));
					} else if (item instanceof Date) {
						NewArray.push(item);
					} else if (typeof item === 'string' && !isEncrypted(item)) {
						NewArray.push(encrypt(item));
					} else {
						NewArray.push(item);
					}
				}

				console.log(NewArray);

				return NewArray;
			} else {
				const NewObject: any = {};

				for (const [key, item] of Object.entries(items)) {
					if (!item || item === null) {
						NewObject[key] = item;

						continue;
					}

					if (typeof item === 'object') {
						NewObject[key] = completeEncrypt(item);
					} else if (item instanceof Date) {
						NewObject[key] = item;
					} else if (typeof item === 'string' && !isEncrypted(item)) {
						NewObject[key] = encrypt(item);
					} else {
						NewObject[key] = item;
					}
				}

				console.log(NewObject);

				return NewObject;
			}
		} else if (typeof items === 'string' && !isEncrypted(items)) {
			return encrypt(items);
		} else {
			return items;
		}
	}
}

export default Encryption;

export { Encryption };
