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

import crypto from "node:crypto";
import { types } from "@kastelll/cassandra-driver";
import { Encryption as En } from "../../Config.ts";

const algorithm = En.Algorithm;
const initVector = En.InitVector;
const securityKey = En.SecurityKey;

class Encryption {
	public static Encrypt(data: string): string {
		try {
			const cipher = crypto.createCipheriv(algorithm, securityKey, initVector);

			const dd = {
				data,
			};

			return cipher.update(Encryption.fixData(dd), "utf8", "hex") + cipher.final("hex");
		} catch {
			throw new Error(`Failed to encrypt data ${data}`);
		}
	}

	public static Decrypt<T = any>(data: string, raw = false): T {
		try {
			const decipher = crypto.createDecipheriv(algorithm, securityKey, initVector);
			const decrypted = decipher.update(data, "hex", "utf8") + decipher.final("utf8");
			const cleaned = Encryption.cleanData(decrypted);

			if (raw) return cleaned;

			return cleaned.data;
		} catch {
			throw new Error(`Failed to decrypt data ${data}`);
		}
	}

	public static isEncrypted(item: string): boolean {
		try {
			Encryption.Decrypt(item);

			return true;
		} catch {
			return false;
		}
	}

	private static fixData(data: any): string {
		let fixedData = data;

		if (typeof fixedData === "object") fixedData = JSON.stringify(data);

		if (typeof fixedData === "undefined") fixedData = "";

		if (typeof fixedData !== "string") fixedData = String(data);

		if (typeof fixedData !== "string") throw new Error(`Failed to stringify data ${typeof fixedData}, ${fixedData}`);

		return fixedData;
	}

	private static cleanData(data: string): any {
		try {
			return JSON.parse(data);
		} catch {
			return data;
		}
	}

	public static CompleteDecryption<T = any>(items: T, raw = false): T {
		if (typeof items === "string") {
			if (Encryption.isEncrypted(items)) return Encryption.Decrypt(items, raw);

			return items;
		}

		if (typeof items !== "object" || items === null) return items;

		if (!Array.isArray(items)) {
			const newObject: any = {};

			for (const [key, value] of Object.entries(items)) {
				if (value instanceof Date || value === null || value instanceof types.Long) {
					newObject[key] = value;
				} else if (typeof value === "object") {
					newObject[key] = this.CompleteDecryption(value);
				} else {
					newObject[key] = Encryption.isEncrypted(value) ? Encryption.Decrypt(value, raw) : value;
				}
			}

			return newObject;
		} else if (Array.isArray(items)) {
			return items.map((value) => this.CompleteDecryption(value)) as T;
		}

		return items;
	}

	public static CompleteEncryption<T = any>(items: T): T {
		if (typeof items === "string") {
			if (Encryption.isEncrypted(items)) return items;

			return Encryption.Encrypt(items) as T;
		}

		if (typeof items !== "object" || items === null) return items;

		if (!Array.isArray(items)) {
			const newObject: any = {};

			for (const [key, value] of Object.entries(items)) {
				if (value instanceof Date || value === null || value instanceof types.Long) {
					newObject[key] = value;
				} else if (typeof value === "object") {
					newObject[key] = this.CompleteEncryption(value);
				} else {
					newObject[key] = Encryption.isEncrypted(value) ? value : Encryption.Encrypt(value);
				}
			}

			return newObject;
		} else if (Array.isArray(items)) {
			return items.map((value) => this.CompleteEncryption(value)) as T;
		}

		return items;
	}
}

export default Encryption;

export { Encryption };
