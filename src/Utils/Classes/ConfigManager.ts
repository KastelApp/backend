import fs from "node:fs/promises";
import { join } from "node:path";
import { watch } from "chokidar";
import { Validator } from "jsonschema";
import type { MySchema } from "@/Types/JsonSchemaType.ts";
import { newprocessArgs } from "../ProcessArgs.ts";
import App from "./App.ts";

export default class ConfigManager {
	public args = newprocessArgs([
		{ name: "config", type: "string", default: "default" },
		{ name: "watch", type: "boolean", optional: true },
	]);

	public envConfig = newprocessArgs([
		{ name: "encryption-algorithm", type: "string", optional: true },
		{ name: "encryption-init-vector", type: "string", optional: true, newName: "encryption-initVector" },
		{ name: "encryption-security-key", type: "string", optional: true, newName: "encryption-securityKey" },
		{ name: "encryption-token-key", type: "string", optional: true, newName: "encryption-tokenKey" },
		{ name: "redis-db", type: "number", optional: true },
		{ name: "redis-port", type: "number", optional: true },
		{ name: "redis-host", type: "string", optional: true },
		{ name: "redis-username", type: "string", optional: true },
		{ name: "redis-password", type: "string", optional: true },
		{ name: "scylla-db-keyspace", type: "string", optional: true, newName: "scyllaDB-keyspace" },
		{ name: "scylla-db-username", type: "string", optional: true, newName: "scyllaDB-username" },
		{ name: "scylla-db-password", type: "string", optional: true, newName: "scyllaDB-password" },
		{ name: "scylla-db-nodes", type: "string[]", optional: true, newName: "scyllaDB-nodes" },
		{ name: "scylla-db-durable-writes", type: "boolean", optional: true, newName: "scyllaDB-durableWrites" },
		{ name: "server-bucket-interval", type: "number", optional: true, newName: "server-bucketInterval" },
		{ name: "server-bucket-rnd", type: "number", optional: true, newName: "server-bucketRnd" },
		{ name: "server-cache-clear-interval", type: "number", optional: true, newName: "server-cache-clearInterval" },
		{ name: "server-cache-clear-on-start", type: "boolean", optional: true, newName: "server-cache-clearOnStart" },
		{ name: "server-captcha-enabled", type: "boolean", optional: true, newName: "server-captchaEnabled" },
		{ name: "server-cloudflare-access-only", type: "boolean", optional: true, newName: "server-cloudflareAccessOnly" },
		{ name: "server-domain", type: "string", optional: true },
		{ name: "server-features", type: "string[]", optional: true },
		{ name: "server-port", type: "string", optional: true },
		{ name: "server-secure", type: "boolean", optional: true },
		{ name: "server-sentry-dsn", type: "string", optional: true },
		{ name: "server-sentry-enabled", type: "boolean", optional: true },
		{
			name: "server-sentry-traces-sample-rate",
			type: "number",
			optional: true,
			newName: "server-sentry-tracesSampleRate",
		},
		{ name: "server-strict-routing", type: "boolean", optional: true, newName: "server-strictRouting" },
		{ name: "server-turnstile-secret", type: "string", optional: true, newName: "server-turnstileSecret" },
		{ name: "server-worker-id", type: "number", optional: true, newName: "server-workerId" },
		{ name: "ws-version", type: "number", optional: true },
		{ name: "ws-url", type: "string", optional: true },
		{ name: "ws-password", type: "string", optional: true },
	]);

	public configsPath = join(import.meta.dirname, "../../configs");

	public templatePath = join(import.meta.dirname, "../../Types/config.template.json");

	public examplePath = join(import.meta.dirname, "../../configs/example.json");

	public validator = new Validator();

	private watching: boolean = false;

	public config: MySchema | null = null;

	private oldConfig: MySchema | null = null;

	private getPath(p?: string): string {
		const configPath = this.args.config as string;

		return p
			? join(this.configsPath, p.endsWith(".json") ? p : `${p}.json`)
			: join(this.configsPath, configPath.endsWith(".json") ? configPath : `${configPath}.json`);
	}

	public async load(path?: string, reload?: boolean): Promise<MySchema | null> {
		const pth = reload ? (path as string) : this.getPath(path);

		const fileExists = await fs.stat(pth).catch(() => false);

		if (this.args.config === "default") {
			const read = fileExists
				? await fs.readFile(pth, { encoding: "utf8" })
				: await fs.readFile(this.examplePath, { encoding: "utf8" });

			const parsed = JSON.parse(read) as MySchema;

			for (const [key, value] of Object.entries(this.envConfig)) {
				const keys = key.split("-");

				let currentObj = parsed;

				for (const [i, k] of keys.entries()) {
					if (i === keys.length - 1) {
						if (value === null) continue;
						// @ts-expect-error -- too lazy to fix
						currentObj[k] = value;
					} else {
						// @ts-expect-error -- too lazy to fix
						currentObj = currentObj[k];
					}
				}
			}

			this.config = parsed;

			await fs.writeFile(pth, JSON.stringify(parsed, null, 4), { encoding: "utf8" });

			App.staticLogger.info(`Created config file: ${pth}`);
		} else if (!fileExists) {
			if (path) {
				throw new Error(`Config file: ${pth} does not exist!`);
			} else {
				return this.load(join(this.configsPath, this.args.config as string));
			}
		}

		const read = await fs.readFile(pth, { encoding: "utf8" });
		const template = await fs.readFile(this.templatePath, { encoding: "utf8" });

		try {
			const parsed = JSON.parse(read) as MySchema;
			const parsedTemplate = JSON.parse(template);

			const result = this.validator.validate(parsed, parsedTemplate);

			if (this.args.watch && !this.watching) {
				this.watching = true;

				watch(pth).on("change", async () => {
					await this.load(pth, true);

					const compared = this.compare(this.oldConfig, this.config);

					if (compared.length > 0) {
						App.staticLogger.info(`Config file has changed, reloading... Keys changed: (${compared.join(", ")})`);
						console.log(this.getKeysOfPathInAKebabCase(this.config));
					} else {
						App.staticLogger.info("Config file has changed, reloading... No keys changed");
					}
				});
			}

			if (result.valid) {
				this.oldConfig = this.config ?? parsed;
				this.config = parsed;
			} else {
				App.staticLogger.warn(
					`Config file is invalid, please fix it before continuing (${this.args.watch ? "The file is being watched" : "Please restart the process once you fix the issue, or use --watch to automatically reload the config"})`,
				);
			}

			return result.valid ? parsed : null;
		} catch {
			App.staticLogger.warn(
				`Config file is invalid, please fix it before continuing (${this.args.watch ? "The file is being watched" : "Please restart the process once you fix the issue, or use --watch to automatically reload the config"})`,
			);

			return null;
		}
	}

	private compare(obj1: any, obj2: any, parentKey: number | string = ""): string[] {
		let changedKeys: string[] = [];

		const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

		for (const key of allKeys) {
			const value1 = obj1[key];
			const value2 = obj2[key];
			const currentKey = parentKey ? `${parentKey}.${key}` : key;

			if (
				typeof value1 === "object" &&
				typeof value2 === "object" &&
				value1 !== null &&
				value2 !== null &&
				!Array.isArray(value1) &&
				!Array.isArray(value2)
			) {
				changedKeys = changedKeys.concat(this.compare(value1, value2, currentKey));
			} else if (this.areBothArrays(value1, value2)) {
				if (value1.length === value2.length) {
					for (const [i, element] of value1.entries()) {
						changedKeys = changedKeys.concat(this.compare(element, value2[i], `${currentKey}[${i}]`));
					}
				} else {
					changedKeys.push(currentKey);
				}
			} else if (value1 !== value2) {
				changedKeys.push(currentKey);
			}
		}

		return changedKeys;
	}

	private areBothArrays(value1: any, value2: any): boolean {
		return Array.isArray(value1) && Array.isArray(value2);
	}

	public getKeysOfPathInAKebabCase(obj: any): string[] {
		// i.e ws.url -> ws-url
		const values: string[] = [];

		for (const [key, value] of Object.entries(obj)) {
			if (typeof value === "object" && value !== null) {
				values.push(...this.getKeysOfPathInAKebabCase(value).map((v) => this.camelToKebabCase(`${key}-${v}`)));
			} else {
				values.push(this.camelToKebabCase(key));
			}
		}

		return values;
	}

	public camelToKebabCase(str: string): string {
		return str.replaceAll(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
	}

	public kebabToCamelCase(str: string): string {
		return str.replaceAll(/-[a-z]/g, (letter) => letter.toUpperCase().replace("-", ""));
	}
}
