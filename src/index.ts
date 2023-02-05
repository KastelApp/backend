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

const timeStarted = Date.now();

import { Config } from './Config';
import Constants, { Relative } from './Constants'

/* Misc Imports */
import mongoose from 'mongoose';
import chalk from 'chalk';

if (Config.Logger.LogLogo) {
    console.log(chalk.hex('#ca8911')(`
██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     
██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     
█████╔╝ ███████║███████╗   ██║   █████╗  ██║     
██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     
██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
A Chatting Application
Running version ${Relative.Version ? `v${Relative.Version}` : 'Unknown version'} of Kastel's Backend. Node.js version ${process.version}\n`));
}

/* Express Imports */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';

/* Util Imports */
import { uriGenerator } from './utils/uriGenerator';
import { HTTPErrors, Route } from '@kastelll/packages';
import { join } from 'node:path';
const Routes = Route.loadRoutes(join(__dirname, 'routes'));
import { Cache } from './utils/Classes/Cache';
import { IpUtils } from './Utils/Classes/IpUtils';
import Turnstile from './Utils/Classes/Turnstile';

/* Express Middleware stuff */
const app = express();

const FourOhFourError = new HTTPErrors(404, {
    routes: {
        code: "RouteNotFound",
        message: "The route you requested does not exist.",
    }
}).toJSON()

app.use(cors())
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .use(bodyParser.raw())
    .use(cookieParser(Config.Server.CookieSecrets))
    .disable('x-powered-by');


/* Error Handling */
if (Config.Logger.LogErrors) {
    process
        .on('uncaughtException', (err) => console.error(`Unhandled Exception, \n${err.stack}`))
        .on('unhandledRejection', (reason: any) => console.error(`Unhandled Rejection, \n${reason?.stack ? reason.stack : reason}`));
}

/* Sets the users IP for later simpler use */
/* Also Logs the requested path */
app.use((req, res, next) => {
    req.clientIp = IpUtils.GetIp(req);
    req.captcha = new Turnstile();

    console.info(`[Stats] ${req.clientIp} Requested ${req.path} (${req.method})`);

    next();
});

app.use((req, res, next) => {
    if (!Config.Server.StrictRouting || (req.path.length <= 1) || !req.path.endsWith('/')) {
        next();
    } else {
        res.status(404).json(FourOhFourError);
    }    
})

Route.setRoutes(app);

/* If the path does not exist */
app.all('*', (req, res) => {
    console.warn(`[Stats] ${req.clientIp} Requested ${req.path} That does does not exist with the method ${req.method}`);

    res.status(404).json(FourOhFourError);

    return;
});


app.listen((Config.Server.Port || 62250), async () => {
    console.info(`[Express] Server Started On Port ${Config.Server.Port || 62250}`);

    const cache = new Cache(Config.Redis.Host, Config.Redis.Port, Config.Redis.User, Config.Redis.Password, Config.Redis.Db);

    await cache.connect().then(() => console.info('[Cache] Redis connected!')).catch((e) => {
        console.error('[Cache] Failed to connect to Redis', e);
        process.exit();
    });

    let cleared = [];

    if (Config.Server.Cache.ClearOnStart) cleared = await cache.clear('ratelimits');

    setInterval(async () => {
        // NOTE WE ARE NOT CLEARING RATELIMITS WE ARE CLEARING EVERYTHING BUT RATELIMITS
        // This is because we want to keep the ratelimits in cache so we can check them
        const clearedKeys = await cache.clear('ratelimits');
        console.info(`[Cache] Cleared ${clearedKeys.length} keys from Cache`);
    }, (Config.Server.Cache.ClearInterval || 10800000));

    app.cache = cache;

    mongoose.set('strictQuery', true);

    mongoose.connect(uriGenerator()).then(() => console.info('[Database] MongoDB connected!')).catch((e) => {
        console.error('[Database] Failed to connect to MongoDB', e);
        process.exit();
    });

    if (Config.Logger.LogInfo) console.info(`[Stats] ${Config.Logger.TimeStartUp ? `Took ${(Math.round(Date.now() - timeStarted) / 1000).toFixed(2)}s to Start Up, ` : ''}Loaded ${Routes.length} Routes, Running Version ${Constants.Relative.Version ? `v${Constants.Relative.Version}` : 'Unknown version'}, Cleared ${cleared.length} keys from cache`);
    if (!Config.Logger.LogInfo && Config.Logger.TimeStartUp) console.info(`[Stats] Took ${(Math.round(Date.now() - timeStarted) / 1000).toFixed(3)}s to Start Up`);
});