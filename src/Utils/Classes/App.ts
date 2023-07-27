import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { URL } from 'node:url';
// import { setInterval } from 'node:timers';
import {
	Snowflake,
	Turnstile,
	CacheManager,
} from '@kastelll/util';
import * as Sentry from '@sentry/node';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import type { Request, Response } from 'express';
import express from 'express';
import mongoose from 'mongoose';
import { Config } from '../../Config.js';
import Constants, { Relative } from '../../Constants.js';
import { uriGenerator } from '../UriGenerator.js';
import Emails from './Emails.js';
import ErrorGen from './ErrorGen.js';
import { IpUtils } from './IpUtils.js';
import CustomLogger from './Logger.js';
// import RequestUtils from './RequestUtils.js';
import type { ContentTypes, ExpressMethod } from './Route.js';
import RouteBuilder from './Route.js';
import SystemSocket from './System/SystemSocket.js';

class App {
	private RouteDirectory: string = join(new URL('.', import.meta.url).pathname, '../../Routes');

	public ExpressApp: express.Application;

	public Ready: boolean = false;

	public Snowflake: Snowflake;

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

	public Routes: {
		default: RouteBuilder;
		directory: string;
		route: string;
	}[] = [];

	public constructor() {
		this.ExpressApp = express();

		this.Snowflake = new Snowflake(Constants.Snowflake);

		this.Cache = new CacheManager({
			...Config.Redis,
			AllowForDangerousCommands: true,
		});

		this.Turnstile = new Turnstile(Config.Server.CaptchaEnabled, Config.Server.TurnstileSecret ?? 'secret');

		this.IpUtils = new IpUtils();

		this.SystemSocket = new SystemSocket(this);

		this.Sentry = Sentry;

		this.Logger = new CustomLogger();
	}

	public async Init(): Promise<void> {
		this.Logger.hex('#ca8911')(`\n██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     \n██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     \n█████╔╝ ███████║███████╗   ██║   █████╗  ██║     \n██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     \n██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗\n╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝\nA Chatting Application\nRunning version ${Relative.Version ? `v${Relative.Version}` : 'Unknown version'} of Kastel's Backend. Node.js version ${process.version}\nIf you would like to support this project please consider donating to https://opencollective.com/kastel\n`);

		this.Cache.on('Connected', () => this.Logger.info('Connected to Redis'));
		this.Cache.on('Error', (err) => {
			this.Logger.fatal(err);

			process.exit(1);
		});
		this.Cache.on('MissedPing', () => this.Logger.warn('Missed Redis ping'));

		mongoose.set('strictQuery', true);

		mongoose.connection.on('connected', () => this.Logger.info('Connected to MongoDB'));

		mongoose.connection.on('error', (err) => {
			this.Logger.fatal(err);

			process.exit(1);
		});

		await mongoose.connect(uriGenerator()).catch((error: any) => {
			this.Logger.fatal(error);
			process.exit(1);
		});

		await this.SystemSocket.Connect();

		await this.Cache.connect();

		if (Config.MailServer.Enabled) {
			const Support = Config.MailServer.Users.find((user) => user.ShortCode === 'Support');
			const NoReply = Config.MailServer.Users.find((user) => user.ShortCode === 'NoReply');

			if (!Support || !NoReply) {
				this.Logger.fatal('Missing Support or NoReply user in config');
				this.Logger.fatal('Disable MailServer in config to ignore this error');

				process.exit(0);
			}

			this.Support = new Emails(Support.Host, Support.Port, Support.Secure, Support.User, Support.Password);

			this.NoReply = new Emails(NoReply.Host, NoReply.Port, NoReply.Secure, NoReply.User, NoReply.Password);

			try {
				await this.Support.Connect();
				await this.NoReply.Connect();
			} catch (error) {
				this.Logger.fatal('Failed to connect to Mail Server', error);
				process.exit();
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
			.use(cookieParser(Config.Server.CookieSecrets))
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

		const LoadedRoutes = await this.LoadRoutes();

		this.Logger.info(`Loaded ${LoadedRoutes.length} routes`);

		for (const Route of LoadedRoutes) {
			for (const Method of Route.default.Methods) {
				this.ExpressApp[Method.toLowerCase() as ExpressMethod](Route.route, ...Route.default.Middleware, (req: Request, res: Response) => {
					const ContentType = req.headers['content-type'] ?? '';

					res.on('finish', () => Route.default.Finish(res, res.statusCode, new Date()));

					if (Route.default.AllowedContentTypes.length > 0 && !Route.default.AllowedContentTypes.includes(ContentType as ContentTypes)) {

						const Error = ErrorGen.InvalidContentType();

						Error.AddError({
							ContentType: {
								Code: 'InvalidContentType',
								Message: `Invalid Content-Type header, Expected (${Route.default.AllowedContentTypes.join(', ')}), Got (${ContentType})`,
							}
						});

						res.status(400).json(Error);

						return;
					}

					Route.default.Request(req, res);
				});
			}
		}
		
		this.ExpressApp.all('*', (req, res) => {
			const Error = ErrorGen.NotFound();

			Error.AddError({
				NotFound: {
					Code: 'NotFound',
					Message: `Could not find route for ${req.method} ${req.path}`,
				}
			});

			res.status(404).json(Error);
		});
		
		this.ExpressApp.listen(Config.Server.Port, () => {
			this.Logger.info(`Listening on port ${Config.Server.Port}`);
		});
	}

	private async LoadRoutes(): Promise<typeof this['Routes']> {
		const Routes = await this.WalkDirectory(this.RouteDirectory);

		for (const Route of Routes) {
			if (!Route.endsWith('.js')) {
				this.Logger.debug(`Skipping ${Route} as it is not a .js file`);

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
				const fixedRoute = ((Route.split(this.RouteDirectory)[1]?.replaceAll(/\\/g, '/').split('/').slice(0, -1).join('/') ?? '') + (SubRoute as string)).replace(/\/$/, '');

				this.Routes.push({
					default: RouteInstance,
					directory: Route,
					route: fixedRoute,
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
}

export default App;

export { App };
