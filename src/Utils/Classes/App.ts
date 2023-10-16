/* eslint-disable id-length */
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { URL } from 'node:url';
import { Snowflake, Turnstile, CacheManager } from '@kastelll/util';
import * as Sentry from '@sentry/node';
import bodyParser from 'body-parser';
import cors from 'cors';
import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import { type SimpleGit, simpleGit } from 'simple-git';
import { Config } from '../../Config.ts';
import Constants, { Relative } from '../../Constants.ts';
import type { ExpressMethodCap } from '../../Types/index.ts';
import ProcessArgs from '../ProcessArgs.ts';
import Connection from './Connection.ts';
import Emails from './Emails.ts';
import ErrorGen from './ErrorGen.ts';
import { IpUtils } from './IpUtils.ts';
import CustomLogger from './Logger.ts';
import Repl from './Repl.ts';
import type { ContentTypes, ExpressMethod } from './Route.ts';
import RouteBuilder from './Route.ts';
import SystemSocket from './System/SystemSocket.ts';
import SystemInfo from './SystemInfo.ts';

type GitType = 'Added' | 'Copied' | 'Deleted' | 'Ignored' | 'Modified' | 'None' | 'Renamed' | 'Unmerged' | 'Untracked';

const SupportedArgs = ['debug', 'skip-online-check', 'behind-proxy', 'no-ip-checking'] as const;

class App {
	private RouteDirectory: string = join(new URL('.', import.meta.url).pathname, '../../Routes');

	public ExpressApp: express.Application;

	public Ready: boolean = false;

	public Snowflake: Snowflake;

	public Cassandra: Connection;

	public Cache: CacheManager;

	public Turnstile: Turnstile;

	public Support: Emails | null = null;

	public NoReply: Emails | null = null;

	public IpUtils: IpUtils;

	public SystemSocket: SystemSocket;

	public Sentry: typeof Sentry;

	public Config: typeof Config = Config;

	public Constants: typeof Constants = Constants;

	public Logger: CustomLogger;

	public static StaticLogger: CustomLogger = new CustomLogger();

	public Routes: {
		default: RouteBuilder;
		directory: string;
		route: string;
	}[] = [];

	private Clean: boolean = false;

	public InternetAccess: boolean = false;

	public Git: SimpleGit = simpleGit();

	private GitFiles: {
		filePath: string;
		type: GitType;
	}[] = [];

	public GitBranch: string = 'Unknown';

	public GitCommit: string = 'Unknown';

	private TypeIndex = {
		A: 'Added',
		D: 'Deleted',
		M: 'Modified',
		R: 'Renamed',
		C: 'Copied',
		U: 'Unmerged',
		'?': 'Untracked',
		'!': 'Ignored',
		' ': 'None',
	};

	public Repl: Repl;

	public Args: typeof SupportedArgs = ProcessArgs(SupportedArgs as unknown as string[])
		.Valid as unknown as typeof SupportedArgs;

	public constructor() {
		this.ExpressApp = express();

		this.Snowflake = new Snowflake(Constants.Snowflake);

		this.Cache = new CacheManager({
			...Config.Redis,
			AllowForDangerousCommands: true,
		});

		this.Cassandra = new Connection(
			Config.ScyllaDB.Nodes,
			Config.ScyllaDB.Username,
			Config.ScyllaDB.Password,
			Config.ScyllaDB.Keyspace,
			Config.ScyllaDB.NetworkTopologyStrategy,
			Config.ScyllaDB.DurableWrites,
			Config.ScyllaDB.CassandraOptions,
		);

		this.Turnstile = new Turnstile(Config.Server.CaptchaEnabled, Config.Server.TurnstileSecret ?? 'secret');

		this.IpUtils = new IpUtils();

		this.SystemSocket = new SystemSocket(this);

		this.Sentry = Sentry;

		this.Logger = new CustomLogger();

		this.Repl = new Repl(CustomLogger.colorize('#E6AF2E', '> '), [
			{
				name: 'disable',
				description: 'Disable something (Route, User, etc)',
				args: [],
				flags: [
					{
						name: 'route',
						description: 'The route to disable',
						shortName: 'r',
						value: 'string',
						maxLength: 1e3,
						minLength: 1,
						optional: true,
					},
					{
						name: 'user',
						description: 'The user to disable',
						shortName: 'u',
						value: 'string',
						maxLength: 1e3,
						minLength: 1,
						optional: true,
					},
				],
				cb: () => {},
			},
			{
				name: 'version',
				description: 'Get the version of the backend',
				args: [],
				flags: [],
				cb: () => {
					console.log(
						`You're running version ${
							Relative.Version ? `v${Relative.Version}` : 'Unknown version'
						} of Kastel's Backend. Bun version ${Bun.version}`,
					);
				},
			},
			{
				name: 'close',
				description: 'Close the REPL (Note: you will need to restart the backend to open it again)',
				args: [],
				flags: [],
				cb: () => {
					this.Repl.endRepl();
				},
			},
			{
				name: 'clear',
				description: 'Clear the console',
				args: [],
				flags: [],
				cb: () => {
					console.clear();
				},
			}
		]);
	}

	public async Init(): Promise<void> {
		this.Logger.hex('#ca8911')(
			`\n██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     \n██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     \n█████╔╝ ███████║███████╗   ██║   █████╗  ██║     \n██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     \n██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗\n╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝\nA Chatting Application\nRunning version ${
				Relative.Version ? `v${Relative.Version}` : 'Unknown version'
			} of Kastel's Backend. Bun version ${
				Bun.version
			}\nIf you would like to support this project please consider donating to https://opencollective.com/kastel\n`,
		);

		await this.SetupDebug(this.Args.includes('debug'));

		this.Repl.startRepl();

		this.Cache.on('Connected', () => this.Logger.info('Connected to Redis'));
		this.Cache.on('Error', (err) => {
			this.Logger.fatal(err);

			process.exit(1);
		});
		this.Cache.on('MissedPing', () => this.Logger.warn('Missed Redis ping'));
		this.Cassandra.on('Connected', () => this.Logger.info('Connected to ScyllaDB'));
		this.Cassandra.on('Error', (err) => {
			console.error(err);
			this.Logger.fatal(err);

			process.exit(1);
		});

		this.Logger.info('Connecting to ScyllaDB');
		this.Logger.warn('IT IS NOT FROZEN, ScyllaDB may take a while to connect');

		await Promise.all([this.SystemSocket.Connect(), this.Cassandra.Connect(), this.Cache.connect()]);

		this.Logger.info('Creating ScyllaDB Tables.. This may take a while..');
		this.Logger.warn('IT IS NOT FROZEN, ScyllaDB may take a while to create the tables');

		const TablesCreated = await this.Cassandra.CreateTables();

		if (TablesCreated) {
			this.Logger.info('Created ScyllaDB tables');
		} else {
			this.Logger.warn('whar');
		}

		if (Config.MailServer.Enabled) {
			const Support = Config.MailServer.Users.find((user) => user.ShortCode === 'Support');
			const NoReply = Config.MailServer.Users.find((user) => user.ShortCode === 'NoReply');

			if (!Support || !NoReply) {
				this.Logger.fatal('Missing Support or NoReply user in config');
				this.Logger.fatal('Disable MailServer in config to ignore this error');

				process.exit(0);
			}

			this.Support = new Emails(
				Support.Host,
				Support.Port,
				Support.Secure,
				Boolean(Support.Password),
				Support.User,
				Support.Password,
			);

			this.NoReply = new Emails(
				NoReply.Host,
				NoReply.Port,
				NoReply.Secure,
				Boolean(Support.Password),
				NoReply.User,
				NoReply.Password,
			);

			try {
				await Promise.all([this.Support.Connect(), this.NoReply.Connect()]);
			} catch (error) {
				this.Logger.fatal('Failed to connect to Mail Server', error);

				process.exit(1);
			}

			this.Logger.info('Mail Server connected!');
		} else {
			this.Logger.info('Mail Server disabled!');
		}

		if (Config.Server.Sentry.Enabled) {
			Sentry.init({
				...Config.Server.Sentry.OtherOptions,
				dsn: Config.Server.Sentry.Dsn,
				tracesSampleRate: Config.Server.Sentry.TracesSampleRate,
				integrations: (integrations) => {
					return [
						...integrations.map((integration) => {
							if (integration.name === 'OnUncaughtException') {
								return new Sentry.Integrations.OnUncaughtException({
									exitEvenIfOtherHandlersAreRegistered: false,
								});
							} else {
								return integration;
							}
						}),
						new Sentry.Integrations.Http({ tracing: true }),
						new Sentry.Integrations.Express({ app: this.ExpressApp }),
					];
				},
			});
		}

		process
			.on('uncaughtException', (err) => {
				if (Config.Server.Sentry.Enabled) {
					Sentry.captureException(err);
				}

				this.Logger.error('Uncaught Exception, \n', err?.stack ? err.stack : err);
			})
			.on('unhandledRejection', (reason: any) => {
				if (Config.Server.Sentry.Enabled) {
					Sentry.captureException(reason);
				}

				this.Logger.error(`Unhandled Rejection, \n${reason?.stack ? reason.stack : reason}`);
			});

		this.ExpressApp.use(cors())
			.use(bodyParser.json())
			.use(bodyParser.urlencoded({ extended: true }))
			.use(bodyParser.raw())
			.disable('x-powered-by');

		if (Config.Server.Sentry.Enabled) {
			this.ExpressApp.use(
				Sentry.Handlers.requestHandler({
					...Config.Server.Sentry.RequestOptions,
				}),
			)
				.use(Sentry.Handlers.tracingHandler())
				.use(Sentry.Handlers.errorHandler());
		}

		// eslint-disable-next-line promise/prefer-await-to-callbacks -- (Its not)
		this.ExpressApp.use((error: Error, _: Request, res: Response, __: NextFunction) => {
			// @ts-expect-error -- express being weird
			if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
				this.Logger.error(`Someone sent invalid JSON`, error);

				res.status(500).json({
					Message: `Invalid JSON (${error.message})`,
				});
			} else {
				res.status(500).json({
					Message: `Internal Server Error :(`,
				});
			}
		});

		this.ExpressApp.use((req, res, next) => {
			req.clientIp = IpUtils.GetIp(req);
			req.methodi = req.method as ExpressMethodCap;
			req.captcha = new Turnstile(this.Config.Server.CaptchaEnabled, this.Config.Server.TurnstileSecret ?? 'secret');

			req.fourohfourit = () => {
				const Error = ErrorGen.NotFound();

				Error.AddError({
					NotFound: {
						Code: 'NotFound',
						Message: `Could not find route for ${req.method} ${req.path}`,
					},
				});

				res.status(404).json(Error.toJSON());

				return true;
			};

			// we have a hard limit of 1mb for requests, any higher and we 408 it
			if (req.socket.bytesRead > 1e6) {
				const Error = ErrorGen.TooLarge();

				Error.AddError({
					TooLarge: {
						Code: 'TooLarge',
						Message: 'Request body too large',
					},
				});

				res.status(408).json(Error.toJSON());

				return;
			}

			next();
		});

		// guilds with params should be at the bottom as ones without them take priority
		const LoadedRoutes = (await this.LoadRoutes()).sort((a, b) => {
			if (a.route.includes(':') && !b.route.includes(':')) {
				return 1;
			}

			if (!a.route.includes(':') && b.route.includes(':')) {
				return -1;
			}

			return 0;
		});

		for (const route of LoadedRoutes) {
			this.Logger.verbose(
				`Loaded "${route.route.length === 0 ? '/' : route.route}" [${route.default.Methods.join(', ')}]`,
			);
		}

		this.Logger.info(`Loaded ${LoadedRoutes.length} routes`);

		for (const Route of LoadedRoutes) {
			for (const Method of Route.default.Methods) {
				this.ExpressApp[Method.toLowerCase() as ExpressMethod](
					Route.route,
					...Route.default.Middleware,
					(req: Request, res: Response) => {
						this.Logger.verbose(
							`Request for ${req.path} (${req.method}) ${
								req?.user?.Id ? `from ${req.user.Id}` : 'from a logged out user.'
							}`,
						);

						const ContentType = req.headers['content-type'] ?? '';

						res.on('finish', () => {
							this.Logger.verbose(
								`Request for ${req.path} (${req.method}) ${
									req?.user?.Id ? `from ${req.user.Id}` : 'from a logged out user.'
								} finished with status code ${res.statusCode}`,
							);

							Route.default.Finish(res, res.statusCode, new Date());
						});

						if (Route.default.KillSwitched) {
							const Error = ErrorGen.ServiceUnavailable();

							Error.AddError({
								ServiceUnavailable: {
									Code: 'ServiceUnavailable',
									Message: 'This endpoint is currently disabled',
								},
							});

							res.status(503).json(Error.toJSON());

							return;
						}

						if (
							Route.default.AllowedContentTypes.length > 0 &&
							!Route.default.AllowedContentTypes.includes(ContentType as ContentTypes)
						) {
							const Error = ErrorGen.InvalidContentType();

							Error.AddError({
								ContentType: {
									Code: 'InvalidContentType',
									Message: `Invalid Content-Type header, Expected (${Route.default.AllowedContentTypes.join(
										', ',
									)}), Got (${ContentType})`,
								},
							});

							res.status(400).json(Error);

							return;
						}

						const PreRan = Route.default.PreRun(req, res);

						if (!PreRan) {
							// note: we expect that it returns a response itself (also PreRun should only be used for special routes not used all the time)
							return;
						}

						// @ts-expect-error -- im tired
						// eslint-disable-next-line promise/prefer-await-to-callbacks, promise/prefer-await-to-then, @typescript-eslint/no-confusing-void-expression
						Route.default.Request(req, res)?.catch((error: Error) => {
							this.Logger.error(error);

							if (!res.headersSent) {
								res.status(500).send('Internal Server Error :(');
							}
						});
					},
				);
			}
		}

		this.ExpressApp.all('*', (req, res) => {
			const Error = ErrorGen.NotFound();

			Error.AddError({
				NotFound: {
					Code: 'NotFound',
					Message: `Could not find route for ${req.method} ${req.path}`,
				},
			});

			res.status(404).json(Error.toJSON());
		});

		this.ExpressApp.listen(Config.Server.Port, () => {
			this.Logger.info(`Listening on port ${Config.Server.Port}`);
		});
	}

	private async LoadRoutes(): Promise<(typeof this)['Routes']> {
		const Routes = await this.WalkDirectory(this.RouteDirectory);

		for (const Route of Routes) {
			if (!Route.endsWith('.ts')) {
				this.Logger.debug(`Skipping ${Route} as it is not a .ts file`);

				continue;
			}

			const RouteClass = await import(Route);

			if (!RouteClass.default) {
				this.Logger.warn(`Skipping ${Route} as it does not have a default export`);

				continue;
			}

			const RouteInstance = new RouteClass.default(this);

			if (!(RouteInstance instanceof RouteBuilder)) {
				this.Logger.warn(`Skipping ${Route} as it does not extend Route`);

				continue;
			}

			for (const SubRoute of RouteInstance.Routes) {
				const fixedRoute = (
					(Route.split(this.RouteDirectory)[1]?.replaceAll(/\\/g, '/').split('/').slice(0, -1).join('/') ?? '') +
					(SubRoute as string)
				).replace(/\/$/, '');

				this.Routes.push({
					default: RouteInstance,
					directory: Route,
					route: fixedRoute.replaceAll(/\[([^\]]+)]/g, ':$1'), // eslint-disable-line prefer-named-capture-group
				});
			}
		}

		return this.Routes;
	}

	private async WalkDirectory(dir: string): Promise<string[]> {
		const Routes = await readdir(dir, { withFileTypes: true });

		const Files: string[] = [];

		for (const Route of Routes) {
			if (Route.isDirectory()) {
				const SubFiles = await this.WalkDirectory(join(dir, Route.name));
				Files.push(...SubFiles);
			} else {
				Files.push(join(dir, Route.name));
			}
		}

		return Files;
	}

	private async SetupDebug(Log: boolean) {
		const SystemClass = new SystemInfo();
		const System = await SystemClass.Info();
		const GithubInfo = await this.GithubInfo();

		const Strings = [
			'='.repeat(40),
			`Kastel Debug Logs`,
			'='.repeat(40),
			`Backend Version: ${this.Constants.Relative.Version}`,
			`Bun Version: ${Bun.version}`,
			'='.repeat(40),
			`System Info:`,
			`OS: ${System.OperatingSystem.Platform}`,
			`Arch: ${System.OperatingSystem.Arch}`,
			`Os Release: ${System.OperatingSystem.Release}`,
			`Internet Status: ${System.InternetAccess ? 'Online' : 'Offline - Some features may not work'}`,
			'='.repeat(40),
			'Hardware Info:',
			`CPU: ${System.Cpu.Type}`,
			`CPU Cores: ${System.Cpu.Cores}`,
			`Total Memory: ${System.Ram.Total}`,
			`Free Memory: ${System.Ram.Available}`,
			`Used Memory: ${System.Ram.Usage}`,
			'='.repeat(40),
			`Process Info:`,
			`PID: ${process.pid}`,
			`Uptime: ${System.Process.Uptime}`,
			'='.repeat(40),
			`Git Info:`,
			`Branch: ${this.GitBranch}`,
			`Commit: ${GithubInfo.CommitShort ?? GithubInfo.Commit}`,
			`Status: ${
				this.Clean ? 'Clean' : 'Dirty - You will not be given support if something breaks with a dirty instance'
			}`,
			this.Clean ? '' : '='.repeat(40),
			`${this.Clean ? '' : 'Changed Files:'}`,
		];

		for (const File of this.GitFiles) {
			Strings.push(`${File.type}: ${File.filePath}`);
		}

		Strings.push('='.repeat(40));

		if (Log) {
			for (const String of Strings) {
				this.Logger.importantDebug(String);
			}
		}
	}

	private async GithubInfo(): Promise<{
		Branch: string;
		Clean: boolean;
		Commit: string | undefined;
		CommitShort: string | undefined;
	}> {
		const Branch = await this.Git.branch();
		const Commit = await this.Git.log();
		const Status = await this.Git.status();

		if (!Commit.latest?.hash) {
			this.Logger.fatal('Could not get Commit Info, are you sure you pulled the repo correctly?');

			process.exit(1);
		}

		this.GitBranch = Branch.current;

		this.GitCommit = Commit.latest.hash;

		this.Clean = Status.files.length === 0;

		for (const File of Status.files) {
			this.GitFiles.push({
				filePath: File.path,
				type: this.TypeIndex[File.working_dir as keyof typeof this.TypeIndex] as GitType,
			});
		}

		return {
			Branch: Branch.current,
			Commit: Commit.latest.hash,
			CommitShort: Commit.latest.hash.slice(0, 7),
			Clean: Status.files.length === 0,
		};
	}
}

export default App;

export { App };
