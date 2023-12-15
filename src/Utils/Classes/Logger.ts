/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	writeFileSync,
	mkdirSync,
	existsSync,
	readdirSync,
	createWriteStream,
	createReadStream,
	rmSync,
} from "node:fs";
import { join } from "node:path";
import { setInterval } from "node:timers";
import { URL } from "node:url";
import * as Sentry from "@sentry/node";
import * as ark from "archiver";
import ProcessArgs from "../ProcessArgs.ts";

type Logtypes = "debug" | "error" | "fatal" | "importantDebug" | "info" | "timer" | "trace" | "verbose" | "warn";

const Args = ProcessArgs(["debug", "no-verbose", "no-console", "super-debug"]);

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

	private readonly writingQueue: {
		file: "error" | "latest";
		message: string[];
	}[];

	// we allow for hex colors to be used (we will convert them to ansi colors)
	private readonly colorTypes: {
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
	) {
		this.logDirectory = options.LogDirectory ?? join(new URL(".", import.meta.url).pathname, "..", "..", "..", "logs");

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

			const Now = new Date();

			if (
				Now.getDate() !== this.prevDate.getDate() ||
				Now.getMonth() !== this.prevDate.getMonth() ||
				Now.getFullYear() !== this.prevDate.getFullYear()
			) {
				this.supersecretdebug("Date changed, compressing logs");

				void this.init();

				this.prevDate = Now;

				this.supersecretdebug("Compressed logs");
			}
		}, 25);

		setInterval(() => {
			this.next();
		}, 25);

		this.colorTypes = {
			info: "#78C3FB",
			verbose: "#78C3FB",
			warn: "#E6AF2E",
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
		if (!existsSync(this.logDirectory)) mkdirSync(this.logDirectory);

		const Compressed = await this.compress();

		if (Compressed) {
			this.supersecretdebug("Compressed logs");
		} else {
			this.supersecretdebug("No logs to compress");
		}

		if (!existsSync(this.latestLog)) {
			this.supersecretdebug("Latest log does not exist, creating it");

			writeFileSync(this.latestLog, "");

			this.supersecretdebug("Created latest log");
		}

		if (!existsSync(this.errorLogs)) {
			this.supersecretdebug("Error log does not exist, creating it");

			writeFileSync(this.errorLogs, "");

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
		return new Promise((resolve) => {
			this.compressing = true;

			const Files = readdirSync(this.logDirectory);

			const CurrentDate = new Date();

			const LogFiles = Files.filter((file) => file.endsWith(".log"));
			const GzipFiles = Files.filter(
				(file) => file.startsWith(`${CurrentDate.toISOString().slice(0, 10)}-`) && file.endsWith(".log.zip"),
			);

			if (LogFiles.length === 0) {
				this.supersecretdebug("No log files to compress");

				resolve(false);

				return;
			}

			const Archive = ark.default.create("zip", {
				zlib: { level: 9 },
			});

			const Output = createWriteStream(
				join(this.logDirectory, `${CurrentDate.toISOString().slice(0, 10)}-${GzipFiles.length + 1}.log.zip`),
			);

			Archive.pipe(Output);

			for (const file of LogFiles) {
				Archive.append(createReadStream(join(this.logDirectory, file)), { name: file });
				this.supersecretdebug(`Added ${file} to archive`);
			}

			Archive.on("finish", () => {
				for (const file of LogFiles) {
					rmSync(join(this.logDirectory, file));

					this.supersecretdebug(`Deleted ${file}`);
				}

				this.supersecretdebug("Deleted old log files");

				this.compressing = false;

				resolve(true);
			});

			void Archive.finalize();

			this.supersecretdebug("Finalized archive");
		});
	}

	private supersecretdebug(...msg: string[]) {
		if (Args.Valid.includes("super-debug")) console.log(`[DEBUG] [LOGGER]: ${msg.join(" ")}`);
	}

	private next(): boolean {
		if (this.writingQueue.length === 0) return true;

		this.supersecretdebug("Writing message");

		const Message = this.writingQueue.shift();

		if (!Message) return true;

		if (Message.file === "latest") {
			this.supersecretdebug("Writing to latest log");
			writeFileSync(this.latestLog, `${Message.message.join("\n")}\n`, { flag: "a" });
		} else if (Message.file === "error") {
			this.supersecretdebug("Writing to crash log");
			writeFileSync(this.errorLogs, `${Message.message.join("\n")}\n`, { flag: "a" });
		} else {
			throw new Error(`Unknown file ${Message.file}`);
		}

		return true;
	}

	private addLog(options: {
		console?: boolean;
		date: Date;
		file: "error" | "latest";
		message: any[];
		toShow?: string;
		type: Logtypes;
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

		const Message = `[${options.date.toLocaleTimeString()}] [MASTER / ${
			options.toShow ? options.toShow.toUpperCase() : options.type.toUpperCase()
		}]:`;

		const Messages = [];

		for (const item of options.message) {
			const LastMessage: any = Messages[Messages.length - 1];
			if (
				typeof item === "string" ||
				typeof item === "number" ||
				typeof item === "boolean" ||
				item === null ||
				item === undefined
			) {
				if (LastMessage && typeof LastMessage === "string") {
					Messages[Messages.length - 1] = `${LastMessage} ${item}`;
				} else {
					Messages.push(item.trim());
				}
			} else if (item instanceof Error) {
				if (item.stack) {
					for (const line of item.stack.split("\n")) {
						Messages.push(line.trim());
					}
				} else {
					Messages.push(item.message.trim());
				}
			} else {
				Messages.push(item);
			}
		}

		const NewMessages = Messages.map((msg) => {
			if (typeof msg === "string") {
				return `${Message} ${msg}`.trim();
			} else {
				const Strongified = JSON.stringify(msg, null, 2);

				return Strongified.split("\n")
					.map((line) => `${Message} ${line}`.trim())
					.join("\n");
			}
		});

		this.writingQueue.push({
			file: options.file,
			message: NewMessages,
		});

		if (options.console) {
			const color = Logger.hexToAnsi(this.colorTypes[options.type]);

			if (color) {
				for (const msg of NewMessages) {
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
		if (!Args.Valid.includes("debug")) return this;

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
		if (!Args.Valid.includes("debug")) return this;

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
		if (Args.Valid.includes("no-verbose")) return this;

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

		if (timer.debug && !Args.Valid.includes("debug")) return this;

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
			const color = Logger.hexToAnsi(hex);

			if (color) {
				for (const msg of message) {
					console.log(`${color.rgb}${msg}${color.end}`);
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
