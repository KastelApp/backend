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

import { join } from 'node:path';
import process from 'node:process';
import { setInterval } from 'node:timers';
import { Route } from '@kastelll/core';
import { HTTPErrors, Snowflake, Turnstile, CacheManager } from '@kastelll/util';
import * as Sentry from '@sentry/node';
import bodyParser from 'body-parser';
import chalk from 'chalk';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { Config } from './Config.js';
import Constants, { Relative } from './Constants.js';
import Emails from './Utils/Classes/Emails.js';
import { IpUtils } from './Utils/Classes/IpUtils.js';
import RequestUtils from './Utils/Classes/RequestUtils.js';
import SystemSocket from './Utils/Classes/System/SystemSocket.js';
import { uriGenerator } from './Utils/UriGenerator.js';

const timeStarted = Date.now();

console.log(
	chalk.hex('#ca8911')(`
██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     
██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     
█████╔╝ ███████║███████╗   ██║   █████╗  ██║     
██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     
██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
A Chatting Application
Running version ${Relative.Version ? `v${Relative.Version}` : 'Unknown version'} of Kastel's Backend. Node.js version ${
		process.version
	}
If you would like to support this project please consider donating to https://opencollective.com/kastel\n`),
);
const Routes = Route.LoadRoutes(join(__dirname, 'routes'));

/* Express Middleware stuff */
const app = express();

const FourOhFourError = new HTTPErrors(404, {
	Routes: {
		Code: 'RouteNotFound',
		Message: 'The route you requested does not exist.',
	},
}).toJSON();

app
	.use(cors())
	.use(bodyParser.json())
	.use(bodyParser.urlencoded({ extended: true }))
	.use(bodyParser.raw())
	.use(cookieParser(Config.Server.CookieSecrets))
	.disable('x-powered-by');

if (Config.Server.Sentry.Enabled) {
	Sentry.init({
		...Config.Server.Sentry.OtherOptions,
		dsn: Config.Server.Sentry.Dsn,
		tracesSampleRate: Config.Server.Sentry.TracesSampleRate,
		// I have no clue if this is setup right, anyways waffles are cool do not forget that
		integrations: (integrations) => {
			return [
				...integrations.map((integration) => {
					if (integration.name === 'OnUncaughtException') {
						// override `OnUncaughtException` integration to not exit.
						return new Sentry.Integrations.OnUncaughtException({
							// do not exit if other uncaught exception handlers are registered.
							exitEvenIfOtherHandlersAreRegistered: false,
						});
					} else {
						return integration;
					}
				}),
				new Sentry.Integrations.Http({ tracing: true }),
				new Sentry.Integrations.Express({ app }),
			];
		},
	});
}

/* Error Handling */
process
	.on('uncaughtException', (err) => {
		if (Config.Server.Sentry.Enabled) {
			Sentry.captureException(err);
		}

		console.error('Uncaught Exception, \n', err?.stack ? err.stack : err);
	})
	.on('unhandledRejection', (reason: any) => {
		if (Config.Server.Sentry.Enabled) {
			Sentry.captureException(reason);
		}

		console.error(`Unhandled Rejection, \n${reason?.stack ? reason.stack : reason}`);
	});

/* Sets the users IP, Setups Captcha & Utils */
/* Also Logs the requested path */

if (Config.Server.Sentry.Enabled) {
	app.use(
		Sentry.Handlers.requestHandler({
			...Config.Server.Sentry.RequestOptions,
		}),
	);
	// TracingHandler creates a trace for every incoming request
	app.use(Sentry.Handlers.tracingHandler());

	app.use(Sentry.Handlers.errorHandler());
}

app.use((req, res, next) => {
	// res.send('owo')

	// let i = true;

	// if (i) return;

	if (!app.ready) {
		res.status(503).json({
			Error: {
				Code: 'ServiceUnavailable',
				Message: 'The service is currently unavailable.',
			},
		});

		return;
	}

	if (Config.Server.StrictRouting && req.path.length > 1 && req.path.endsWith('/')) {
		res.status(404).json(FourOhFourError);

		return;
	}

	// Client IP is just different headers to get the actual IP of the user
	req.clientIp = IpUtils.GetIp(req);

	// Captcha is a Turnstile class that is for verifying captchas
	req.captcha = new Turnstile(Config.Server.CaptchaEnabled, Config.Server.TurnstileSecret ?? 'secret');

	// Utils is a few utils for easily fetching data. This is so we can have less repeated code :D
	req.utils = new RequestUtils(req, res);

	console.info(`[Stats] ${req.clientIp} Requested ${req.path} (${req.method})`);

	res.on('finish', () => {
		console.info(`[Stats] ${req.clientIp} Requested ${req.path} (${req.method}) - ${res.statusCode}`);
	});

	next();
});

Route.SetRoutes(app);

/* If the path does not exist */
app.all('*', (req, res) => {
	console.warn(`[Stats] ${req.clientIp} Requested ${req.path} That does does not exist with the method ${req.method}`);

	res.status(404).json(FourOhFourError);
});

app.listen(Config.Server.Port ?? 62_250, async () => {
	app.ready = false;

	console.info(`[Express] Server Started On Port ${Config.Server.Port ?? 62_250}`);

	app.snowflake = new Snowflake(Constants.Snowflake);

	const cache = new CacheManager({
		...Config.Redis,
		AllowForDangerousCommands: true,
	});
	
	cache.on('Connected', () => {
		console.info('[Cache] Redis connected!');
	});
	
	cache.on('Error', (error: any) => {
		console.error('[Cache] Failed to connect to Redis', error);
		
		process.exit();
	});
	
	cache.on('MissedPing', () => {
		console.warn('[Cache] Missed ping from Redis');
	})

	await cache.connect()

	if (Config.Server.Cache.ClearOnStart) {
		await cache.flush('ratelimits');
	}

	setInterval(async () => {
		// NOTE WE ARE NOT CLEARING RATELIMITS WE ARE CLEARING EVERYTHING BUT RATELIMITS
		// This is because we want to keep the ratelimits in cache so we can check them
		await cache.flush('ratelimits');

		console.info(`[Cache] Cleared keys from Cache`);
	}, Config.Server.Cache.ClearInterval || 10_800_000);

	app.cache = cache;

	mongoose.set('strictQuery', true);

	await mongoose.connect(uriGenerator()).catch((error: any) => {
		console.error('[Database] Failed to connect to MongoDB', error);
		process.exit();
	});

	console.info('[Database] MongoDB connected!');

	const Socket = new SystemSocket();

	await Socket.Connect();

	app.socket = Socket;

	if (Config.MailServer.Enabled) {
		const Support = Config.MailServer.Users.find((user) => user.ShortCode === 'Support');
		const NoReply = Config.MailServer.Users.find((user) => user.ShortCode === 'NoReply');

		if (!Support || !NoReply) {
			console.error('[Mail] Missing Support or NoReply user in config');
			console.error('[Mail] Disable MailServer in config to ignore this error');
			process.exit();
		}

		app.request.Support = new Emails(Support.Host, Support.Port, Support.Secure, Support.User, Support.Password);

		app.request.NoReply = new Emails(NoReply.Host, NoReply.Port, NoReply.Secure, NoReply.User, NoReply.Password);

		try {
			await app.request.Support.Connect();
			await app.request.NoReply.Connect();
		} catch (error) {
			console.error('[Mail] Failed to connect to Mail Server', error);
			process.exit();
		}

		console.info('[Mail] Mail Server connected!');
	} else {
		console.info('[Mail] Mail Server disabled!');

		app.request.Support = null;

		app.request.NoReply = null;
	}

	console.info(
		`[Stats] Took ${(Math.round(Date.now() - timeStarted) / 1_000).toFixed(2)}s to Start Up, Loaded ${
			Routes.length
		} Routes, Running Version ${Constants.Relative.Version ? `v${Constants.Relative.Version}` : 'Unknown version'}`,
	);

	app.ready = true;
});
