/* eslint-disable id-length */
import process from "node:process";
import { CacheManager } from "@kastelll/util";
import * as Sentry from "@sentry/bun";
import { type SimpleGit, simpleGit } from "simple-git";
import type { MySchema } from "@/Types/JsonSchemaType.ts";
import Constants, { relative, statusTypes } from "../../Constants.ts";
import processArgs from "../ProcessArgs.ts";
import ConfigManager from "./ConfigManager.ts";
import Connection from "./Connection.ts";
import Encryption from "./Encryption.ts";
import { IpUtils } from "./IpUtils.ts";
import CustomLogger from "./Logger.ts";
import Question from "./Question.ts";
import type { GetChannelTypes, channels } from "./Shared/RabbitMQ.ts";
import Snowflake from "./Snowflake.ts";
import SystemInfo from "./SystemInfo.ts";

type GitType = "Added" | "Copied" | "Deleted" | "Ignored" | "Modified" | "None" | "Renamed" | "Unmerged" | "Untracked";

class App {
	public ready: boolean = false;

	public static snowflake: Snowflake = new Snowflake(
		Constants.snowflake.Epoch,
		Constants.snowflake.WorkerId,
		Constants.snowflake.ProcessId,
		Constants.snowflake.TimeShift,
		Constants.snowflake.WorkerIdBytes,
		Constants.snowflake.ProcessIdBytes,
	);

	public cassandra!: Connection;

	public cache!: CacheManager;

	public ipUtils: IpUtils;

	public sentry: typeof Sentry;

	public constants: typeof Constants = Constants;

	public static staticLogger: CustomLogger = new CustomLogger();

	private clean: boolean = false;

	public internetAccess: boolean = false;

	public static git: SimpleGit = simpleGit();

	public static gitFiles: {
		filePath: string;
		type: GitType;
	}[] = [];

	public static gitBranch: string = "Unknown";

	public static gitCommit: string = "Unknown";

	public static typeIndex = {
		A: "Added",
		D: "Deleted",
		M: "Modified",
		R: "Renamed",
		C: "Copied",
		U: "Unmerged",
		"?": "Untracked",
		"!": "Ignored",
		" ": "None",
	};

	public args = processArgs(["debug", "skip-online-check", "behind-proxy", "no-ip-checking"]).valid;

	public static configManager: ConfigManager = new ConfigManager();

	public static questionier: Question = new Question();

	public constructor(public who: string) {
		this.ipUtils = new IpUtils();

		this.sentry = Sentry;

		this.logger.who = who;
	}

	public logo() {
		this.logger.hex("#ca8911")(
			`\n██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     \n██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     \n█████╔╝ ███████║███████╗   ██║   █████╗  ██║     \n██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     \n██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗\n╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝\nA Chatting Application\nRunning version ${
				relative.Version ? `v${relative.Version}` : "Unknown version"
			} of Kastel's Backend. Bun version ${
				Bun.version
			}\nIf you would like to support this project please consider donating to https://opencollective.com/kastel\n`,
		);
	}

	public async init(): Promise<void> {
		await this.setupDebug(this.args.includes("debug"));
		const loaded = await App.configManager.load();

		if (!loaded) {
			this.logger.error("Initial config load failed");

			process.exit();
		}

		Encryption.setConfig(this.config.encryption);

		this.cache = new CacheManager({
			AllowForDangerousCommands: true,
			DB: this.config.redis.db,
			Host: this.config.redis.host,
			Password: this.config.redis.password,
			Port: this.config.redis.port,
			Username: this.config.redis.username,
		});

		this.cassandra = new Connection(
			this.config.scyllaDB.nodes,
			this.config.scyllaDB.username,
			this.config.scyllaDB.password,
			this.config.scyllaDB.keyspace,
			this.config.scyllaDB.networkTopologyStrategy,
			this.config.scyllaDB.durableWrites,
		);

		this.cache.on("Connected", () => this.logger.info("Connected to Redis"));
		this.cache.on("Error", (err) => {
			this.logger.fatal(err);

			process.exit(1);
		});
		this.cache.on("MissedPing", () => this.logger.warn("Missed Redis ping"));
		this.cassandra.on("Connected", () => this.logger.info("Connected to ScyllaDB"));
		this.cassandra.on("Error", (err) => {
			// @ts-expect-error -- its fine
			this.logger.fatal(`${err.name}: ${err.message} ${err.query}\n${err.stack.replace("Error: \n", "")}`);

			process.exit(1);
		});

		this.logger.info("Connecting to ScyllaDB");
		this.logger.warn("IT IS NOT FROZEN, ScyllaDB may take a while to connect");

		await Promise.all([this.cassandra.connect(), this.cache.connect()]);

		this.logger.info("Creating ScyllaDB Tables.. This may take a while..");
		this.logger.warn("IT IS NOT FROZEN, ScyllaDB may take a while to create the tables");

		const tablesCreated = await this.cassandra.createTables();

		if (tablesCreated) {
			this.logger.info("Created ScyllaDB tables");
		} else {
			this.logger.error("This shouldn't happen, please report this");
		}
	}

	public checkObjectForBlacklistedFields(object: unknown, blacklistedFields: string[]): boolean {
		if (typeof object !== "object" || object === null || object instanceof Date) return false;

		if (Array.isArray(object)) {
			for (const item of object) {
				if (this.checkObjectForBlacklistedFields(item, blacklistedFields)) return true;
			}

			return false;
		}

		for (const [key, value] of Object.entries(object)) {
			if (blacklistedFields.includes(key)) return true;

			if (this.checkObjectForBlacklistedFields(value, blacklistedFields)) return true;
		}

		return false;
	}

	private async setupDebug(Log: boolean) {
		const systemClass = new SystemInfo();
		const system = await systemClass.Info();
		const githubInfo = await App.githubInfo();

		App.gitBranch = githubInfo.Branch;
		App.gitCommit = githubInfo.Commit!;
		this.clean = githubInfo.Clean;

		const strings = [
			"=".repeat(40),
			"Kastel Debug Logs",
			"=".repeat(40),
			`Backend Version: ${this.constants.relative.Version}`,
			`Bun Version: ${Bun.version}`,
			"=".repeat(40),
			"System Info:",
			`OS: ${system.operatingSystem.platform}`,
			`Arch: ${system.operatingSystem.arch}`,
			`Os Release: ${system.operatingSystem.release}`,
			`Internet Status: ${system.internetAccess ? "Online" : "Offline - Some features may not work"}`,
			"=".repeat(40),
			"Hardware Info:",
			`CPU: ${system.cpu.type}`,
			`CPU Cores: ${system.cpu.cores}`,
			`Total Memory: ${system.ram.Total}`,
			`Free Memory: ${system.ram.Available}`,
			`Used Memory: ${system.ram.Usage}`,
			"=".repeat(40),
			"Process Info:",
			`PID: ${process.pid}`,
			`Uptime: ${system.process.uptime}`,
			"=".repeat(40),
			"Git Info:",
			`Branch: ${App.gitBranch}`,
			`Commit: ${githubInfo.CommitShort ?? githubInfo.Commit}`,
			`Status: ${
				this.clean ? "Clean" : "Dirty - You will not be given support if something breaks with a dirty instance"
			}`,
			this.clean ? "" : "=".repeat(40),
			`${this.clean ? "" : "Changed Files:"}`,
		];

		for (const file of App.gitFiles) {
			// if the directory is "node_modules", ".bun", ".git", ".yarn" we want to ignore it

			if (["node_modules", ".bun", ".git", ".yarn"].includes(file.filePath.split("/")[0] ?? "")) {
				continue;
			}

			strings.push(`${file.type}: ${file.filePath}`);
		}

		strings.push("=".repeat(40));

		if (Log) {
			for (const string of strings) {
				this.logger.importantDebug(string);
			}
		}
	}

	public static async githubInfo(): Promise<{
		Branch: string;
		Clean: boolean;
		Commit: string | undefined;
		CommitShort: string | undefined;
	}> {
		const branch = await App.git.branch();
		const commit = await App.git.log();
		const status = await App.git.status();

		if (!commit.latest?.hash) {
			App.staticLogger.fatal("Could not get Commit Info, are you sure you pulled the repo correctly?");

			process.exit(1);
		}

		for (const file of status.files) {
			App.gitFiles.push({
				filePath: file.path,
				type: this.typeIndex[file.working_dir as keyof typeof this.typeIndex] as GitType,
			});
		}

		return {
			Branch: branch.current,
			Commit: commit.latest.hash,
			CommitShort: commit.latest.hash.slice(0, 7),
			Clean: status.files.length === 0,
		};
	}

	public getBucket(Snowflake?: string): string {
		let bucketNumber;

		if (Snowflake) {
			bucketNumber = BigInt(App.snowflake.timeStamp(Snowflake)) - App.snowflake.epoch;
		} else {
			bucketNumber = BigInt(Date.now()) - App.snowflake.epoch;
		}

		let bucket = bucketNumber / BigInt(this.config.server.bucketInterval);

		bucket += BigInt(this.config.server.bucketRnd);

		return bucket.toString(16);
	}

	public getBuckets(StartId: string, EndId?: string) {
		const startBucket = this.getBucket(StartId);
		const endBucket = this.getBucket(EndId);

		let startBucketNumber = Number.parseInt(startBucket, 16);
		let endBucketNumber = Number.parseInt(endBucket, 16);

		startBucketNumber -= this.config.server.bucketRnd;
		endBucketNumber -= this.config.server.bucketRnd;

		const bucketRange = endBucketNumber - startBucketNumber;

		const buckets = [];

		for (let int = 0; int <= bucketRange; int++) {
			let currentBucket = startBucketNumber + int;

			currentBucket += this.config.server.bucketRnd;

			buckets.push(currentBucket.toString(16));
		}

		return buckets;
	}

	public rabbitMQForwarder(topic: GetChannelTypes<typeof channels>, data: unknown) {
		postMessage({
			type: "rabbitMQ",
			data: {
				topic,
				data,
			},
		});
	}

	/**
	 * basically can handle bigints turning them into strings
	 */
	public jsonStringify(data: unknown) {
		return JSON.stringify(Encryption.completeDecryption(data), (_, value) => {
			if (typeof value === "bigint") {
				return value.toString();
			}

			return value;
		});
	}

	public get status() {
		return {
			has: (type: keyof typeof statusTypes, int: number) => {
				const foundInt = statusTypes[type];

				return (int & foundInt) === foundInt;
			},
			remove: (type: keyof typeof statusTypes, int: number) => {
				const foundInt = statusTypes[type];

				return int & ~foundInt;
			},
			add: (type: keyof typeof statusTypes, int: number) => {
				const foundInt = statusTypes[type];

				return int | foundInt;
			},
			isOffline: (int: number) => {
				return this.status.has("offline", int);
			},
			get: (int: number) => {
				if (this.status.has("offline", int)) return "offline";
				if (this.status.has("dnd", int)) return "dnd";
				if (this.status.has("idle", int)) return "idle";
				if (this.status.has("invisible", int)) return "invisible";

				return "online";
			},
		};
	}

	public get config() {
		return App.configManager.config as MySchema;
	}

	public static get config() {
		return App.configManager.config as MySchema;
	}

	public get logger(): CustomLogger {
		return App.staticLogger;
	}

	public static get logger(): CustomLogger {
		return App.staticLogger;
	}

	public get snowflake(): Snowflake {
		return App.snowflake;
	}

	public get questionier(): Question {
		return App.questionier;
	}
}

export default App;

export { App };
