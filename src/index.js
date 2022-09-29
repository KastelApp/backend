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

require('./utils/checker.js');
const config = require('./config');

// If the user wants to time the startup
const timeStarted = config.Logger.timeStartUp ? (Date.now()) : null;

/* Misc Imports */
const { default: mongoose } = require('mongoose');
const chalk = require('chalk');

if (config.Logger.logLogo) {
    console.log(chalk.hex('#ca8911')(`
██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     
██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     
█████╔╝ ███████║███████╗   ██║   █████╗  ██║     
██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     
██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
A Chatting Application
Running version ${config.Constants.version ? `v${config.Constants.version}` : 'Unknown version'} of Kastel's Backend. Node.js version ${process.version}\n`));
}

/* Express Imports */
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

/* Util Imports */
const uriGenerator = require('./utils/uriGenerator');
const logger = require('./utils/classes/logger');
const Route = require('./utils/classes/Route');
const Routes = Route.loadRoutes(require('node:path').join(__dirname, 'routes'));
const Cache = require('./utils/classes/Cache');
require('./utils/classes/snowflake'); // Imported so settings are setup

/* Express Middleware stuff */
const app = express();

app.use(cors())
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .use(bodyParser.raw())
    .use(cookieParser(config.Server.cookieSecrets))
    .disable('x-powered-by');


/* Error Handling */
if (config.Logger.logErrors) {
    process
        .on('uncaughtException', (err) => logger.important.error(`Unhandled Exception, \n${err.stack}`))
        .on('unhandledRejection', (reason) => logger.important.error(`Unhandled Rejection, \n${reason.stack}`));
}

/* Sets the users IP for later simpler use */
/* Also Logs the requested path */
app.use((req, res, next) => {
    req.clientIp = (req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip).replace('::ffff:', '');

    logger.info(`${req.clientIp} Requested ${req.path} (${req.method})`);

    next();
});

Route.setRoutes(app);

/* If the path does not exist */
app.all('*', (req, res) => {
    logger.warn(`${req.clientIp} Requested ${req.path} That does does not exist with the method ${req.method}`);

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


app.listen((config.Server.port || 62250), async () => {
    logger.important.info(`Server Started On Port ${config.Server.port || 62250}`);

    const cache = new Cache(config.Redis.host, config.Redis.port, config.Redis.user, config.Redis.password, config.Redis.db);

    await cache.connect().then(() => logger.important.info('Redis connected!')).catch((e) => {
        logger.important.error('Failed to connect to Redis', e);
        process.exit();
    });

    let cleared = [];

    if (config.Server.cache.clearOnStart) cleared = await cache.clear('ratelimits');

    setInterval(async () => {
        // NOTE WE ARE NOT CLEARING RATELIMITS WE ARE CLEARING EVERYTHING BUT RATELIMITS
        const clearedKeys = await cache.clear('ratelimits');
        logger.important.info(`Cleared ${clearedKeys.length} keys from Cache`);
    }, (config.Server.cache.clearInterval || 10800000));

    app.cache = cache;

    await mongoose.connect(uriGenerator(), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        keepAlive: true,
    }).then(() => logger.important.info('MongoDB connected!')).catch((e) => {
        logger.important.error('Failed to connect to MongoDB', e);
        process.exit();
    });

    if (config.Logger.logInfo) logger.important.info(`${config.Logger.timeStartUp ? `Took ${(Math.round(Date.now() - timeStarted) / 1000).toFixed(2)}s to Start Up, ` : ''}Loaded ${Routes.length} Routes, Running Version ${config.Constants.version ? `v${config.Constants.version}` : 'Unknown version'}, Cleared ${cleared.length} keys from cache`);
    if (!config.Logger.logInfo && config.Logger.timeStartUp) logger.important.info(`Took ${(Math.round(Date.now() - timeStarted) / 1000).toFixed(3)}s to Start Up`);
});
