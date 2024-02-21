import crypto from "node:crypto";
import { types } from "@kastelapp/cassandra-driver";
import App from "./App.ts";

class Encryption {
	public static config = {
		algorithm: "",
		initVector: "",
		securityKey: "",
	};

	public static setConfig(config: typeof Encryption["config"]) {
		Encryption.config = config;
	}

	public static encrypt(data: string): string {
		try {
			const cipher = crypto.createCipheriv(this.config.algorithm, this.config.securityKey, this.config.initVector);

			const dd = {
				data,
			};

			return cipher.update(Encryption.fixData(dd), "utf8", "hex") + cipher.final("hex");
		} catch {
			throw new Error(`Failed to encrypt data ${data}`);
		}
	}

	public static decrypt(data: string, raw = false): string {
		try {
			const decipher = crypto.createDecipheriv(this.config.algorithm, this.config.securityKey, this.config.initVector);
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
			Encryption.decrypt(item);

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

	public static completeDecryption<T = any>(items: T, raw = false): T {
		if (typeof items === "string") {
			if (Encryption.isEncrypted(items)) return Encryption.decrypt(items, raw) as T;

			return items;
		}

		if (typeof items !== "object" || items === null) return items;

		if (!Array.isArray(items)) {
			const newObject: any = {};

			for (const [key, value] of Object.entries(items)) {
				if (value instanceof Date || value === null || value instanceof types.Long) {
					newObject[key] = value;
				} else if (typeof value === "object") {
					newObject[key] = this.completeDecryption(value);
				} else {
					newObject[key] = Encryption.isEncrypted(value) ? Encryption.decrypt(value, raw) : value;
				}
			}

			return newObject;
		} else if (Array.isArray(items)) {
			return items.map((value) => this.completeDecryption(value)) as T;
		}

		return items;
	}

	public static completeEncryption<T = any>(items: T): T {
		if (typeof items === "string") {
			if (Encryption.isEncrypted(items)) return items;

			return Encryption.encrypt(items) as T;
		}

		if (typeof items !== "object" || items === null) return items;
		if (["number", "boolean"].includes(typeof items)) return items;

		if (!Array.isArray(items)) {
			const newObject: any = {};

			for (const [key, value] of Object.entries(items)) {
				if (value instanceof Date || value === null || value instanceof types.Long) {
					newObject[key] = value;
				} else if (typeof value === "object") {
					newObject[key] = this.completeEncryption(value);
				} else {
					newObject[key] = Encryption.isEncrypted(value) ? value : Encryption.encrypt(value);
				}
			}

			return newObject;
		} else if (Array.isArray(items)) {
			return items.map((value) => this.completeEncryption(value)) as T;
		}

		return items;
	}

	public static encryptedSnowflake() {
		return Encryption.encrypt(App.snowflake.generate());
	}
}

export default Encryption;

export { Encryption };
