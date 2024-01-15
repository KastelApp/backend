/* eslint-disable id-length */
import { join } from "node:path";
import process from "node:process";
import { URL } from "node:url";
import { cors } from "@elysiajs/cors";
import { serverTiming } from "@elysiajs/server-timing";
import { Snowflake, Turnstile, CacheManager } from "@kastelll/util";
import * as Sentry from "@sentry/node";
import { Elysia } from "elysia";
import { type SimpleGit, simpleGit } from "simple-git";
import { config } from "../../Config.ts";
import Constants, { relative } from "../../Constants.ts";
import processArgs from "../ProcessArgs.ts";
import Connection from "./Connection.ts";
import errorGen from "./ErrorGen.ts";
import FileSystemRouter from "./FileSystemRouter.ts";
import { IpUtils } from "./IpUtils.ts";
import CustomLogger from "./Logger.ts";
import type { ContentTypes } from "./Routing/Route.ts";
import RouteBuilder from "./Routing/Route.ts";
import SystemSocket from "./System/SystemSocket.ts";
import SystemInfo from "./SystemInfo.ts";

type GitType = "Added" | "Copied" | "Deleted" | "Ignored" | "Modified" | "None" | "Renamed" | "Unmerged" | "Untracked";

const supportedArgs = ["debug", "skip-online-check", "behind-proxy", "no-ip-checking"] as const;

class App {
	private RouteDirectory: string = join(new URL(".", import.meta.url).pathname, "../../Routes");

	public ElysiaApp: Elysia;

	public Ready: boolean = false;

	public static Snowflake: Snowflake = new Snowflake(Constants.snowflake);

	public Cassandra: Connection;

	public Cache: CacheManager;

	public Turnstile: Turnstile;

	public IpUtils: IpUtils;

	public SystemSocket: SystemSocket;

	public Sentry: typeof Sentry;

	public Config: typeof config = config;

	public Constants: typeof Constants = Constants;

	public Logger: CustomLogger;

	public static StaticLogger: CustomLogger = new CustomLogger();

	public RouteCache: Map<
		string,
		{
			path: string;
			route: string;
			routeClass: RouteBuilder;
		}
	> = new Map();

	private Clean: boolean = false;

	public InternetAccess: boolean = false;

	public static Git: SimpleGit = simpleGit();

	public static GitFiles: {
		filePath: string;
		type: GitType;
	}[] = [];

	public static GitBranch: string = "Unknown";

	public static GitCommit: string = "Unknown";

	public static TypeIndex = {
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

	public Args = processArgs(supportedArgs).valid;

	public Router: FileSystemRouter;

	public constructor() {
		this.ElysiaApp = new Elysia();

		this.Cache = new CacheManager({
			...config.Redis,
			AllowForDangerousCommands: true,
		});

		this.Cassandra = new Connection(
			config.ScyllaDB.Nodes,
			config.ScyllaDB.Username,
			config.ScyllaDB.Password,
			config.ScyllaDB.Keyspace,
			config.ScyllaDB.NetworkTopologyStrategy,
			config.ScyllaDB.DurableWrites,
			config.ScyllaDB.CassandraOptions,
		);

		this.Turnstile = new Turnstile(config.Server.CaptchaEnabled, config.Server.TurnstileSecret ?? "secret");

		this.IpUtils = new IpUtils();

		this.SystemSocket = new SystemSocket(this);

		this.Sentry = Sentry;

		this.Logger = new CustomLogger();

		this.Router = new FileSystemRouter({
			dir: this.RouteDirectory,
			style: "nextjs",
			watch: true,
			allowIndex: false,
		});
	}

	public async Init(): Promise<void> {
		this.Logger.hex("#ca8911")(
			`\n██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     \n██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     \n█████╔╝ ███████║███████╗   ██║   █████╗  ██║     \n██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     \n██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗\n╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝\nA Chatting Application\nRunning version ${relative.Version ? `v${relative.Version}` : "Unknown version"
			} of Kastel's Backend. Bun version ${Bun.version
			}\nIf you would like to support this project please consider donating to https://opencollective.com/kastel\n`,
		);

		await this.SetupDebug(this.Args.includes("debug"));

		// this.Repl.startRepl();

		this.Router.on("reload", async ({ path, type, directory }) => {
			this.Logger.verbose(
				`Reloaded Routes due to a ${directory ? "directory" : "file"} (${path}) being ${type === "A" ? "Added" : type === "M" ? "Modified" : type === "D" ? "Removed" : "Unknown"
				}`,
			);

			if (!directory && type !== "D") {
				const loaded = await this.LoadRoute(
					path,
					Object.keys(this.Router.routes).find((route) => this.Router.routes[route] === path) ?? "",
				);

				if (!loaded) {
					this.Logger.warn(`Failed to load ${path}`);

					return;
				}

				this.Logger.info(`Loaded ${loaded.route}`);
			}
		});

		this.Cache.on("Connected", () => this.Logger.info("Connected to Redis"));
		this.Cache.on("Error", (err) => {
			this.Logger.fatal(err);

			process.exit(1);
		});
		this.Cache.on("MissedPing", () => this.Logger.warn("Missed Redis ping"));
		this.Cassandra.on("Connected", () => this.Logger.info("Connected to ScyllaDB"));
		this.Cassandra.on("Error", (err) => {
			this.Logger.fatal(err);

			process.exit(1);
		});

		this.Logger.info("Connecting to ScyllaDB");
		this.Logger.warn("IT IS NOT FROZEN, ScyllaDB may take a while to connect");

		await Promise.all([this.SystemSocket.Connect(), this.Cassandra.Connect(), this.Cache.connect()]);

		this.Logger.info("Creating ScyllaDB Tables.. This may take a while..");
		this.Logger.warn("IT IS NOT FROZEN, ScyllaDB may take a while to create the tables");

		const tablesCreated = await this.Cassandra.CreateTables();

		if (tablesCreated) {
			this.Logger.info("Created ScyllaDB tables");
		} else {
			this.Logger.error("This shouldn't happen, please report this");
		}

		if (config.MailServer.Enabled) {
			const support = config.MailServer.Users.find((user) => user.ShortCode === "Support");
			const noReply = config.MailServer.Users.find((user) => user.ShortCode === "NoReply");

			if (!support || !noReply) {
				this.Logger.fatal("Missing Support or NoReply user in config");
				this.Logger.fatal("Disable MailServer in config to ignore this error");

				process.exit(0);
			}

			this.Logger.info("Mail Server connected!");
		} else {
			this.Logger.info("Mail Server disabled!");
		}

		this.ElysiaApp.use(cors())
			.use(serverTiming())
			.onError(({ code, request, path, error }) => {
				this.Logger.error(`Error ${code} on route ${path} [${request.method}]`);

				console.log(error);

				return "Internal Server Error :(";
			});

		for (const [name, route] of Object.entries(this.Router.routes)) {
			const loaded = await this.LoadRoute(route, name);

			if (!loaded) {
				this.Logger.warn(`Failed to load ${name}`);

				continue;
			}

			this.Logger.info(`Loaded ${loaded.route}`);
		}

		this.Logger.info(`Loaded ${Object.keys(this.Router.routes).length} routes`);

		this.ElysiaApp.all("*", async ({ body, headers, params, path, query, request, set, store }) => {
			const ip = IpUtils.getIp(request, this.ElysiaApp.server) ?? "";
			const isLocalIp = IpUtils.isLocalIp(ip);

			if (isLocalIp && process.env.NODE_ENV !== "development") {
				this.Logger.warn(`Local IP ${ip} tried to access ${path}`);

				set.status = 403;

				return "Forbidden";
			}
			
			const matched = this.Router.match(request);

			if (!matched) {
				const error = errorGen.NotFound();

				error.addError({
					notFound: {
						code: "NotFound",
						message: `Could not find route for ${request.method} ${path}`,
					},
				});

				return error.toJSON();
			}

			const route = this.RouteCache.get(matched.filePath);

			if (!route) {
				this.Logger.error(`Could not find route for ${request.method} ${path} but it was successfully matched`);

				return "Internal Server Error :(";
			}

			this.Logger.info(`Request to "${route.route}" [${request.method}]`);

			const foundMethod = route.routeClass.__methods?.find(
				(method) => method.method === request.method.toLowerCase(),
			) ?? { name: "Request", method: "get" };

			if (!foundMethod) {
				const error = errorGen.MethodNotAllowed();

				error.addError({
					methodNotAllowed: {
						code: "MethodNotAllowed",
						message: `Method "${request.method
							}" is not allowed for "${path}", allowed methods are [${route.routeClass.__methods
								.map((method) => method.method.toUpperCase())
								.join(", ")}]`,
					},
				});

				return error.toJSON();
			}

			const middleware = route.routeClass.__middlewares?.filter((middleware) => middleware.name === foundMethod.name);
			const contentTypes = route.routeClass.__contentTypes?.find(
				(contentType) => contentType.name === foundMethod.name,
			);
			// @ts-expect-error -- I know what I'm doing
			const routeClassFunction = route.routeClass[foundMethod.name].bind(route.routeClass);
			const finishedMiddlewares = [];

			if (!routeClassFunction) {
				this.Logger.error(`Could not find function for ${request.method} ${path} but it was successfully matched`);

				return "Internal Server Error :(";
			}

			if (
				contentTypes &&
				contentTypes.type.length > 0 &&
				!contentTypes.type.includes((headers["content-type"] ?? "text/plain") as ContentTypes) &&
				!contentTypes.type.includes("any")
			) {
				const error = errorGen.InvalidContentType();

				error.addError({
					contentType: {
						code: "InvalidContentType",
						message: `Invalid Content-Type header, Expected (${contentTypes.type.join(", ")}), Got (${headers["content-type"]
							})`,
					},
				});

				set.status = 400;
				set.headers["Content-Type"] = "application/json";

				this.Logger.info(
					`Request to "${route.route}" [${request.method}] finished with status ${set.status} from invalid content type`,
				);

				return error.toJSON();
			}

			if (middleware && middleware.length > 0) {
				for (const middle of middleware) {
					const finished = await middle.ware({
						app: this,
						body: body as {},
						headers,
						params,
						path,
						query,
						request,
						set,
						store,
						ip
					});

					if (set.status !== 200) {
						this.Logger.info(
							`Request to "${route.route}" [${request.method}] finished with status ${set.status} from middleware ${middle.ware.name}`,
						);
						
						return finished;
					}

					finishedMiddlewares.push(finished);
				}
			}

			const requested = (await routeClassFunction({
				app: this,
				body: body as {},
				headers,
				params,
				path,
				query,
				request,
				set,
				store,
				ip,
				...finishedMiddlewares.reduce((a, b) => ({ ...a, ...b }), {}),
			})) as Promise<unknown>;
			
			if (typeof requested === "object") {
				// Go through requested, we want to alert the console when we detect an "email, phone number, password" field in the response
				// There will be whitelisted paths, such as /auth/register, /users/@me etc
				// If we detect one we warn it to the console then return a 500 error
				const whitelistedPaths = ["/auth/register", "/users/@me"];
				
				const checked = this.checkObjectForBlacklistedFields(requested, ["email", "phoneNumber", "password"]);
				
				if (checked && !(whitelistedPaths.includes(path) || whitelistedPaths.includes(path.slice(3)))) {
					set.status = 500;
					
					this.Logger.warn(`Blacklisted field detected in response for ${path}`);
					
					return "Internal Server Error :(";
				}
			}

			this.Logger.info(`Request to "${route.route}" [${request.method}] finished with status ${set.status}`);

			return requested;
		});

		this.ElysiaApp.listen(config.Server.Port, () => {
			this.Logger.info(`Listening on port ${config.Server.Port}`);
		});
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

	private async LoadRoute(path: string, route: string) {
		if (this.RouteCache.has(path)) {
			this.RouteCache.delete(path);
		}

		// this is a hack to make sure it doesn't cache the file
		const routeClass = (await import(`${path}?t=${Date.now()}`)) as { default: typeof RouteBuilder; };

		if (!routeClass.default) {
			this.Logger.warn(`Skipping ${path} as it does not have a default export`);

			return;
		}

		const routeInstance = new routeClass.default(this);

		if (!(routeInstance instanceof RouteBuilder)) {
			this.Logger.warn(`Skipping ${path} as it does not extend Route`);

			return;
		}

		this.RouteCache.set(path, {
			path,
			route,
			routeClass: routeInstance,
		});

		return this.RouteCache.get(path);
	}

	private async SetupDebug(Log: boolean) {
		const systemClass = new SystemInfo();
		const system = await systemClass.Info();
		const githubInfo = await App.GithubInfo();

		App.GitBranch = githubInfo.Branch;
		App.GitCommit = githubInfo.Commit!;
		this.Clean = githubInfo.Clean;
		
		const strings = [
			"=".repeat(40),
			"Kastel Debug Logs",
			"=".repeat(40),
			`Backend Version: ${this.Constants.relative.Version}`,
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
			`Branch: ${App.GitBranch}`,
			`Commit: ${githubInfo.CommitShort ?? githubInfo.Commit}`,
			`Status: ${this.Clean ? "Clean" : "Dirty - You will not be given support if something breaks with a dirty instance"
			}`,
			this.Clean ? "" : "=".repeat(40),
			`${this.Clean ? "" : "Changed Files:"}`,
		];

		for (const file of App.GitFiles) {
			// if the directory is "node_modules", ".bun", ".git", ".yarn" we want to ignore it

			if (["node_modules", ".bun", ".git", ".yarn"].includes(file.filePath.split("/")[0] ?? "")) {
				continue;
			}

			strings.push(`${file.type}: ${file.filePath}`);
		}

		strings.push("=".repeat(40));

		if (Log) {
			for (const string of strings) {
				this.Logger.importantDebug(string);
			}
		}
	}

	public static async GithubInfo(): Promise<{
		Branch: string;
		Clean: boolean;
		Commit: string | undefined;
		CommitShort: string | undefined;
	}> {
		const branch = await App.Git.branch();
		const commit = await App.Git.log();
		const status = await App.Git.status();

		if (!commit.latest?.hash) {
			App.StaticLogger.fatal("Could not get Commit Info, are you sure you pulled the repo correctly?");

			process.exit(1);
		}
		
		for (const file of status.files) {
			App.GitFiles.push({
				filePath: file.path,
				type: this.TypeIndex[file.working_dir as keyof typeof this.TypeIndex] as GitType,
			});
		}

		return {
			Branch: branch.current,
			Commit: commit.latest.hash,
			CommitShort: commit.latest.hash.slice(0, 7),
			Clean: status.files.length === 0,
		};
	}

	public GetBucket(Snowflake?: string): string {
		let bucketNumber;

		if (Snowflake) {
			bucketNumber = BigInt(App.Snowflake.TimeStamp(Snowflake)) - App.Snowflake.Epoch;
		} else {
			bucketNumber = BigInt(Date.now()) - App.Snowflake.Epoch;
		}

		let bucket = bucketNumber / BigInt(this.Config.Server.BucketInterval);

		bucket += BigInt(this.Config.Server.BucketRnd);

		return bucket.toString(16);
	}

	public GetBuckets(StartId: string, EndId?: string) {
		const startBucket = this.GetBucket(StartId);
		const endBucket = this.GetBucket(EndId);

		let startBucketNumber = Number.parseInt(startBucket, 16);
		let endBucketNumber = Number.parseInt(endBucket, 16);

		startBucketNumber -= this.Config.Server.BucketRnd;
		endBucketNumber -= this.Config.Server.BucketRnd;

		const bucketRange = endBucketNumber - startBucketNumber;

		const buckets = [];

		for (let int = 0; int <= bucketRange; int++) {
			let currentBucket = startBucketNumber + int;

			currentBucket += this.Config.Server.BucketRnd;

			buckets.push(currentBucket.toString(16));
		}

		return buckets;
	}
}

export default App;

export { App };
