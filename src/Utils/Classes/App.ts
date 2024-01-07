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

	public Snowflake: Snowflake;

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

	public Git: SimpleGit = simpleGit();

	private GitFiles: {
		filePath: string;
		type: GitType;
	}[] = [];

	public GitBranch: string = "Unknown";

	public GitCommit: string = "Unknown";

	private TypeIndex = {
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

	// public Repl: Repl;

	public Args = processArgs(supportedArgs).valid;

	protected Router: FileSystemRouter;

	public constructor() {
		this.ElysiaApp = new Elysia();

		this.Snowflake = new Snowflake(Constants.snowflake);

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

		// this.Repl = new Repl(CustomLogger.colorize("#E6AF2E", "> "), [
		// 	{
		// 		name: "disable",
		// 		description: "Disable something (Route, User, etc)",
		// 		args: [],
		// 		flags: [
		// 			{
		// 				name: "route",
		// 				description: "The route to disable",
		// 				shortName: "r",
		// 				value: "string",
		// 				maxLength: 1e3,
		// 				minLength: 1,
		// 				optional: true,
		// 			},
		// 			{
		// 				name: "user",
		// 				description: "The user to disable",
		// 				shortName: "u",
		// 				value: "string",
		// 				maxLength: 1e3,
		// 				minLength: 1,
		// 				optional: true,
		// 			},
		// 		],
		// 		cb: () => {},
		// 	},
		// 	{
		// 		name: "version",
		// 		description: "Get the version of the backend",
		// 		args: [],
		// 		flags: [],
		// 		cb: () => {
		// 			console.log(
		// 				`You're running version ${
		// 					Relative.Version ? `v${Relative.Version}` : "Unknown version"
		// 				} of Kastel's Backend. Bun version ${Bun.version}`,
		// 			);
		// 		},
		// 	},
		// 	{
		// 		name: "close",
		// 		description: "Close the REPL (Note: you will need to restart the backend to open it again)",
		// 		args: [],
		// 		flags: [],
		// 		cb: () => {
		// 			this.Repl.endRepl();
		// 		},
		// 	},
		// 	{
		// 		name: "clear",
		// 		description: "Clear the console",
		// 		args: [],
		// 		flags: [],
		// 		cb: () => {
		// 			console.clear();
		// 		},
		// 	},
		// ]);
	}

	public async Init(): Promise<void> {
		this.Logger.hex("#ca8911")(
			`\n██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     \n██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     \n█████╔╝ ███████║███████╗   ██║   █████╗  ██║     \n██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     \n██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗\n╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝\nA Chatting Application\nRunning version ${
				relative.Version ? `v${relative.Version}` : "Unknown version"
			} of Kastel's Backend. Bun version ${
				Bun.version
			}\nIf you would like to support this project please consider donating to https://opencollective.com/kastel\n`,
		);

		await this.SetupDebug(this.Args.includes("debug"));

		// this.Repl.startRepl();

		this.Router.on("reload", async ({ path, type, directory }) => {
			this.Logger.verbose(
				`Reloaded Routes due to a ${directory ? "directory" : "file"} (${path}) being ${
					type === "A" ? "Added" : type === "M" ? "Modified" : type === "D" ? "Removed" : "Unknown"
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
			.onError(({ code, request, path }) => {
				this.Logger.error(`Error ${code} on route ${path} [${request.method}]`);

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
			const matched = this.Router.match(request);

			if (!matched) {
				const error = errorGen.NotFound();

				error.AddError({
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

			const foundMethod = route.routeClass.__methods.find((method) => method.method === request.method.toLowerCase());

			if (!foundMethod) {
				const error = errorGen.MethodNotAllowed();

				error.AddError({
					methodNotAllowed: {
						code: "MethodNotAllowed",
						message: `Method "${
							request.method
						}" is not allowed for "${path}", allowed methods are [${route.routeClass.__methods
							.map((method) => method.method.toUpperCase())
							.join(", ")}]`,
					},
				});

				return error.toJSON();
			}

			const middleware = route.routeClass.__middlewares.filter((middleware) => middleware.name === foundMethod.name);
			const contentTypes = route.routeClass.__contentTypes.find((contentType) => contentType.name === foundMethod.name);
			// @ts-expect-error -- I know what I'm doing
			const routeClassFunction = route.routeClass[foundMethod.name];
			const finishedMiddlewares = [];

			if (!routeClassFunction) {
				this.Logger.error(`Could not find function for ${request.method} ${path} but it was successfully matched`);

				return "Internal Server Error :(";
			}

			if (
				contentTypes &&
				contentTypes.type.length > 0 &&
				!contentTypes.type.includes((headers["content-type"] ?? "text/plain") as ContentTypes)
			) {
				const error = errorGen.InvalidContentType();

				error.AddError({
					contentType: {
						code: "InvalidContentType",
						message: `Invalid Content-Type header, Expected (${contentTypes.type.join(", ")}), Got (${
							headers["content-type"]
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

			if (middleware.length > 0) {
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
				...finishedMiddlewares.reduce((a, b) => ({ ...a, ...b }), {}),
			})) as Promise<unknown>;

			this.Logger.info(`Request to "${route.route}" [${request.method}] finished with status ${set.status}`);

			return requested;
		});

		this.ElysiaApp.listen(config.Server.Port, () => {
			this.Logger.info(`Listening on port ${config.Server.Port}`);
		});
	}

	private async LoadRoute(path: string, route: string) {
		if (this.RouteCache.has(path)) {
			this.RouteCache.delete(path);
		}

		// this is a hack to make sure it doesn't cache the file
		const routeClass = (await import(`${path}?t=${Date.now()}`)) as { default: typeof RouteBuilder };

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

	// private async LoadRoutes(): Promise<(typeof this)["Routes"]> {
	// 	const routes = await this.WalkDirectory(this.RouteDirectory);

	// 	for (const route of routes) {
	// 		if (!route.endsWith(".ts")) {
	// 			this.Logger.debug(`Skipping ${route} as it is not a .ts file`);

	// 			continue;
	// 		}

	// 		const routeClass = await import(route);

	// 		if (!routeClass.default) {
	// 			this.Logger.warn(`Skipping ${route} as it does not have a default export`);

	// 			continue;
	// 		}

	// 		const routeInstance = new routeClass.default(this);

	// 		if (!(routeInstance instanceof RouteBuilder)) {
	// 			this.Logger.warn(`Skipping ${route} as it does not extend Route`);

	// 			continue;
	// 		}

	// 		const routes: {
	// 			contentTypes: ContentTypes[];
	// 			method: Method;
	// 			path: string;
	// 		}[] = [];

	// 		for (const subRoute of routeInstance.Route) {
	// 			const fixedRoute = (
	// 				(route.split(this.RouteDirectory)[1]?.replaceAll(/\\/g, "/").split("/").slice(0, -1).join("/") ?? "") +
	// 				(subRoute.Path as string)
	// 			).replace(/\/$/, "");

	// 			routes.push({
	// 				method: subRoute.Method,
	// 				path: fixedRoute,
	// 				contentTypes: subRoute.ContentTypes,
	// 			});
	// 		}

	// 		this.Routes.push({
	// 			default: routeInstance,
	// 			directory: route,
	// 			routes,
	// 		});
	// 	}

	// 	return this.Routes;
	// }

	// private async WalkDirectory(dir: string): Promise<string[]> {
	// 	const routes = await readdir(dir, { withFileTypes: true });

	// 	const files: string[] = [];

	// 	for (const route of routes) {
	// 		if (route.isDirectory()) {
	// 			const subFiles = await this.WalkDirectory(join(dir, route.name));
	// 			files.push(...subFiles);
	// 		} else {
	// 			files.push(join(dir, route.name));
	// 		}
	// 	}

	// 	return files;
	// }

	private async SetupDebug(Log: boolean) {
		const systemClass = new SystemInfo();
		const system = await systemClass.Info();
		const githubInfo = await this.GithubInfo();

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
			`Branch: ${this.GitBranch}`,
			`Commit: ${githubInfo.CommitShort ?? githubInfo.Commit}`,
			`Status: ${
				this.Clean ? "Clean" : "Dirty - You will not be given support if something breaks with a dirty instance"
			}`,
			this.Clean ? "" : "=".repeat(40),
			`${this.Clean ? "" : "Changed Files:"}`,
		];

		for (const file of this.GitFiles) {
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

	private async GithubInfo(): Promise<{
		Branch: string;
		Clean: boolean;
		Commit: string | undefined;
		CommitShort: string | undefined;
	}> {
		const branch = await this.Git.branch();
		const commit = await this.Git.log();
		const status = await this.Git.status();

		if (!commit.latest?.hash) {
			this.Logger.fatal("Could not get Commit Info, are you sure you pulled the repo correctly?");

			process.exit(1);
		}

		this.GitBranch = branch.current;

		this.GitCommit = commit.latest.hash;

		this.Clean = status.files.length === 0;

		for (const file of status.files) {
			this.GitFiles.push({
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
			bucketNumber = BigInt(this.Snowflake.TimeStamp(Snowflake)) - this.Snowflake.Epoch;
		} else {
			bucketNumber = BigInt(Date.now()) - this.Snowflake.Epoch;
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
