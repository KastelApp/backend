/* eslint-disable promise/prefer-await-to-callbacks */
/* eslint-disable promise/prefer-await-to-then */
import { createWriteStream, createReadStream } from "node:fs";
import { writeFile, mkdir, exists, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { setInterval } from "node:timers";
import * as Sentry from "@sentry/bun";
import * as ark from "archiver";
import { isMainThread } from "bun";
import processArgs from "../ProcessArgs.ts";

type Logtypes = "debug" | "error" | "fatal" | "importantDebug" | "info" | "timer" | "trace" | "verbose" | "warn";

const args = processArgs(["debug", "no-verbose", "no-console", "super-debug"]);

class Logger {
	private readonly logDirectory: string;

	private readonly latestLog: string;

	private readonly errorLogs: string;

	private prevDate: Date;

	private compressing: boolean;

	private readonly backlog: {
		date: Date;
		file: "error" | "latest";
		message: any[];
		toShow?: string;
		type: Logtypes;
	}[]; // when we are compressing logs we haven't saved yet need to be kept here.

	public readonly writingQueue: {
		file: "error" | "latest";
		message: string[];
	}[];

	// we allow for hex colors to be used (we will convert them to ansi colors)
	public colorTypes: {
		[key in Logtypes]: string;
	};

	private readonly console: boolean;

	private readonly timers: Map<
		string,
		{
			debug: boolean;
			start: Date;
		}
	>;

	public constructor(
		options: {
			Colors?: {
				[key in Logtypes]?: string;
			};
			LogDirectory?: string;
			console?: boolean;
		} = {},
		public who: string = "",
	) {
		this.logDirectory = options.LogDirectory ?? join(import.meta.dirname, "..", "..", "..", "logs");

		this.latestLog = join(this.logDirectory, "latest.log");

		this.errorLogs = join(this.logDirectory, "errors.log");

		void this.init();

		this.prevDate = new Date();

		this.compressing = false;

		this.backlog = [];

		this.writingQueue = [];

		this.console = options.console ?? true;

		this.timers = new Map();

		setInterval(() => {
			if (this.compressing) return; // if we are compressing logs then we don't want to do anything.

			const now = new Date();

			if (
				now.getDate() !== this.prevDate.getDate() ||
				now.getMonth() !== this.prevDate.getMonth() ||
				now.getFullYear() !== this.prevDate.getFullYear()
			) {
				this.supersecretdebug("Date changed, compressing logs");

				void this.init();

				this.prevDate = now;

				this.supersecretdebug("Compressed logs");
			}
		}, 25);

		setInterval(() => {
			this.next();
		}, 25);

		this.colorTypes = {
			info: "#2c85c7",
			verbose: "#2c85c7",
			warn: "#b5871b",
			error: "#941C2F",
			debug: "#666A86",
			fatal: "#941C2F",
			trace: "#026C7C",
			timer: "#026C7C",
			// important debug should be bright, catch the eye
			importantDebug: "#5d6af0",
			...options.Colors,
		};
	}

	private async init(): Promise<void> {
		if (!isMainThread) return;

		if (!(await exists(this.logDirectory))) await mkdir(this.logDirectory);

		const compressed = await this.compress();

		if (compressed) {
			this.supersecretdebug("Compressed logs");
		} else {
			this.supersecretdebug("No logs to compress");
		}

		if (!(await exists(this.latestLog))) {
			this.supersecretdebug("Latest log does not exist, creating it");

			await writeFile(this.latestLog, "");

			this.supersecretdebug("Created latest log");
		}

		if (!(await exists(this.errorLogs))) {
			this.supersecretdebug("Error log does not exist, creating it");

			await writeFile(this.errorLogs, "");

			this.supersecretdebug("Created error log");
		}

		this.supersecretdebug("Logger initialized");
	}

	public static hexToAnsi(hex: string): {
		end: string;
		rgb: string;
	} {
		const replacedHex = hex.replace("#", "");

		const int = Number.parseInt(replacedHex, 16);

		const red = (int >> 16) & 255;
		const green = (int >> 8) & 255;
		const blue = int & 255;

		return {
			end: "\u001B[0m",
			rgb: `\u001B[38;2;${red};${green};${blue}m`,
		};
	}

	private async compress(): Promise<boolean> {
		if (!isMainThread) return false;

		this.compressing = true;

		const files = await readdir(this.logDirectory);

		const currentDate = new Date();

		const logFiles = files.filter((file) => file.endsWith(".log"));

		return new Promise((resolve) => {
			const gzipFiles = files.filter(
				(file) => file.startsWith(`${currentDate.toISOString().slice(0, 10)}-`) && file.endsWith(".log.zip"),
			);

			if (logFiles.length === 0) {
				this.supersecretdebug("No log files to compress");

				resolve(false);

				return;
			}

			const archive = ark.default.create("zip", {
				zlib: { level: 9 },
			});

			const output = createWriteStream(
				join(this.logDirectory, `${currentDate.toISOString().slice(0, 10)}-${gzipFiles.length + 1}.log.zip`),
			);

			archive.pipe(output);

			for (const file of logFiles) {
				archive.append(createReadStream(join(this.logDirectory, file)), { name: file });
				this.supersecretdebug(`Added ${file} to archive`);
			}

			archive.on("finish", async () => {
				for (const file of logFiles) {
					await rm(join(this.logDirectory, file)).catch(() => {});

					this.supersecretdebug(`Deleted ${file}`);
				}

				this.supersecretdebug("Deleted old log files");

				this.compressing = false;

				resolve(true);
			});

			void archive.finalize();

			this.supersecretdebug("Finalized archive");
		});
	}

	private supersecretdebug(...msg: string[]) {
		if (args.valid.includes("super-debug")) console.log(`[DEBUG] [LOGGER]: ${msg.join(" ")}`);
	}

	private next(): boolean {
		if (this.writingQueue.length === 0) return true;

		this.supersecretdebug("Writing message");

		const message = this.writingQueue.shift();

		if (!message) return true;

		if (!isMainThread) {
			postMessage({
				type: "log",
				data: message,
			});

			return true;
		}

		if (message.file === "latest") {
			this.supersecretdebug("Writing to latest log");
			writeFile(this.latestLog, `${message.message.join("\n")}\n`, { flag: "a" }).catch((error) =>
				Sentry.captureException(error),
			);
		} else if (message.file === "error") {
			this.supersecretdebug("Writing to crash log");
			writeFile(this.errorLogs, `${message.message.join("\n")}\n`, { flag: "a" }).catch((error) =>
				Sentry.captureException(error),
			);
		} else {
			throw new Error(`Unknown file ${message.file}`);
		}

		return true;
	}

	/**
	 * @description Do not use this function, internal use only (exposed for parent thread)
	 */
	public addLog(options: {
		console?: boolean;
		date: Date;
		file: "error" | "latest";
		message: any[];
		toShow?: string;
		type: Logtypes;
		who?: string;
	}) {
		if (this.compressing) {
			this.backlog.push({
				type: options.type,
				message: options.message,
				date: options.date,
				file: options.file,
				...(options.toShow && { toShow: options.toShow }),
			});

			return;
		}

		const newWho = options.who ?? this.who;

		const message = `[${options.date.toLocaleTimeString()}]${newWho.length > 0 ? ` [${newWho}]` : ""} [${
			options.toShow ? options.toShow.toUpperCase() : options.type.toUpperCase()
		}]:`;

		const messages = [];

		for (const item of options.message) {
			const lastMessage: any = messages[messages.length - 1];
			if (
				typeof item === "string" ||
				typeof item === "number" ||
				typeof item === "boolean" ||
				item === null ||
				item === undefined
			) {
				if (lastMessage && typeof lastMessage === "string") {
					messages[messages.length - 1] = `${lastMessage} ${item}`;
				} else {
					messages.push(item?.trim());
				}
			} else if (item instanceof Error) {
				if (item.stack) {
					for (const line of item.stack.split("\n")) {
						messages.push(line.trim());
					}
				} else {
					messages.push(item.message.trim());
				}
			} else {
				messages.push(item);
			}
		}

		const newMessages = messages.map((msg) => {
			if (typeof msg === "string" || msg === null || msg === undefined) {
				return `${message} ${msg}`.trim();
			} else {
				const stringified = JSON.stringify(msg, null, 2);

				return stringified
					.split("\n")
					.map((line) => `${message} ${line}`.trim())
					.join("\n");
			}
		});

		this.writingQueue.push({
			file: options.file,
			message: newMessages,
		});

		if (options.console) {
			const color = Logger.hexToAnsi(this.colorTypes[options.type]);

			if (color) {
				for (const msg of newMessages) {
					console.log(`${color.rgb}${msg}${color.end}`);
				}
			}
		}
	}

	public info(...message: any[]) {
		this.addLog({
			type: "info",
			date: new Date(),
			file: "latest",
			message,
			console: this.console,
		});

		return this;
	}

	public warn(...message: any[]) {
		this.addLog({
			type: "warn",
			date: new Date(),
			file: "latest",
			message,
			console: this.console,
		});

		return this;
	}

	public error(...message: any[]) {
		Sentry.captureException(message.join("\n"));

		this.addLog({
			type: "error",
			date: new Date(),
			file: "error",
			message,
			console: this.console,
		});

		return this;
	}

	public debug(...message: any[]) {
		if (!args.valid.includes("debug")) return this;

		this.addLog({
			type: "debug",
			date: new Date(),
			file: "latest",
			message,
			console: this.console,
		});

		return this;
	}

	public importantDebug(...message: any[]) {
		if (!args.valid.includes("debug")) return this;

		this.addLog({
			type: "importantDebug",
			date: new Date(),
			file: "latest",
			message,
			console: this.console,
			toShow: "Debug",
		});

		return this;
	}

	public fatal(...message: any[]) {
		Sentry.captureException(message.join("\n"));

		this.addLog({
			type: "fatal",
			date: new Date(),
			file: "error",
			message,
			console: this.console,
		});

		return this;
	}

	public trace(...message: any[]) {
		this.addLog({
			type: "trace",
			date: new Date(),
			file: "latest",
			message,
			console: this.console,
		});

		return this;
	}

	public verbose(...message: any[]) {
		if (args.valid.includes("no-verbose")) return this;

		this.addLog({
			type: "verbose",
			date: new Date(),
			file: "latest",
			message,
			console: this.console,
			toShow: "Info",
		});

		return this;
	}

	public startTimer(name: string, debug: boolean = false) {
		this.timers.set(name, {
			start: new Date(),
			debug,
		});

		return this;
	}

	public stopTimer(name: string) {
		const timer = this.timers.get(name);

		if (!timer) throw new Error(`Timer ${name} not found`);

		const end = new Date();

		const diff = end.getTime() - timer.start.getTime();

		if (timer.debug && !args.valid.includes("debug")) return this;

		this.addLog({
			type: "timer",
			date: new Date(),
			file: "latest",
			message: [`Timer ${name} took ${diff}ms`],
			console: this.console,
		});

		return this;
	}

	public hex(hex: string) {
		return (...message: string[]) => {
			const coor = Logger.hexToAnsi(hex);

			if (coor) {
				for (const msg of message) {
					console.log(`${coor.rgb}${msg}${coor.end}`);
				}
			}
		};
	}

	public static colorize(hex: string, str: string) {
		const color = this.hexToAnsi(hex);

		if (color) {
			return `${color.rgb}${str}${color.end}`;
		} else {
			return str;
		}
	}
}

export default Logger;
