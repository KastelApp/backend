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

if (Config.Logger.logLogo) {
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
import { Route } from '@kastelll/packages';
import { join } from 'node:path';
const Routes = Route.loadRoutes(join(__dirname, 'routes'));
import { Cache } from './utils/classes/Cache';

/* Express Middleware stuff */
const app = express();

app.use(cors())
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .use(bodyParser.raw())
    .use(cookieParser(Config.Server.cookieSecrets))
    .disable('x-powered-by');


/* Error Handling */
if (Config.Logger.logErrors) {
    process
        .on('uncaughtException', (err) => console.error(`Unhandled Exception, \n${err.stack}`))
        .on('unhandledRejection', (reason: any) => console.error(`Unhandled Rejection, \n${reason?.stack ? reason.stack : reason}`));
}

/* Sets the users IP for later simpler use */
/* Also Logs the requested path */
app.use((req, res, next) => {
    req.clientIp = ((req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip) as string).replace('::ffff:', '');

    console.info(`${req.clientIp} Requested ${req.path} (${req.method})`);

    next();
});

Route.setRoutes(app);

/* If the path does not exist */
app.all('*', (req, res) => {
    console.warn(`${req.clientIp} Requested ${req.path} That does does not exist with the method ${req.method}`);

    res.status(404).send({
        code: 404,
        errors: [{
            code: 'PATH_DOESNT_EXIST',
            message: 'The path you request does not exist, or you are using a invalid method to access the path.',
        }],
        responses: [],
    });

    return;
});


app.listen((Config.Server.port || 62250), async () => {
    console.info(`Server Started On Port ${Config.Server.port || 62250}`);

    const cache = new Cache(Config.Redis.host, Config.Redis.port, Config.Redis.user, Config.Redis.password, Config.Redis.db);

    await cache.connect().then(() => console.info('Redis connected!')).catch((e) => {
        console.error('Failed to connect to Redis', e);
        process.exit();
    });

    let cleared = [];

    if (Config.Server.cache.clearOnStart) cleared = await cache.clear('ratelimits');

    setInterval(async () => {
        // NOTE WE ARE NOT CLEARING RATELIMITS WE ARE CLEARING EVERYTHING BUT RATELIMITS
        // This is because we want to keep the ratelimits in cache so we can check them
        const clearedKeys = await cache.clear('ratelimits');
        console.info(`Cleared ${clearedKeys.length} keys from Cache`);
    }, (Config.Server.cache.clearInterval || 10800000));

    app.cache = cache;

    mongoose.set('strictQuery', true);

    mongoose.connect(uriGenerator()).then(() => console.info('MongoDB connected!')).catch((e) => {
        console.error('Failed to connect to MongoDB', e);
        process.exit();
    });

    if (Config.Logger.logInfo) console.info(`${Config.Logger.timeStartUp ? `Took ${(Math.round(Date.now() - timeStarted) / 1000).toFixed(2)}s to Start Up, ` : ''}Loaded ${Routes.length} Routes, Running Version ${Constants.Relative.Version ? `v${Constants.Relative.Version}` : 'Unknown version'}, Cleared ${cleared.length} keys from cache`);
    if (!Config.Logger.logInfo && Config.Logger.timeStartUp) console.info(`Took ${(Math.round(Date.now() - timeStarted) / 1000).toFixed(3)}s to Start Up`);
});
