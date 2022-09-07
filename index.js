/*! 
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║     
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

const config = require("./config");

// If the user wants to time the startup
let timeStarted = config.Logger.timeStartUp ? (Date.now()) : null

/* Misc Imports */
const { default: mongoose } = require("mongoose");
const chalk = require("chalk")

if (config.Logger.logLogo) {
    console.log(chalk.hex("#ca8911")(`
██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     
██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     
█████╔╝ ███████║███████╗   ██║   █████╗  ██║     
██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     
██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
A Chatting Application
Running version ${config.Misc.kas_version ? `v${config.Misc.kas_version}` : "Unknown version"} of Kastel's Backend. Node.js version ${process.version}\n`))
}

/* Express Imports */
const express = require('express');
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

/* Util Imports */
const redis = require("./utils/classes/redis");
const routeHandler = require("./utils/routeHandler");
const uriGenerator = require("./utils/uriGenerator");
const logger = require("./utils/classes/logger");
const fs = require("node:fs");
require("./utils/classes/snowflake"); // Imported so settings are setup

/* Express Middleware stuff */
const app = express()

app.use(cors())
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .use(bodyParser.raw())
    .use(cookieParser(config.Server.cookieSecrets))
    .disable("x-powered-by");

/* Error Handling */
if (config.Logger.logErrors) {
    process.on("uncaughtException", (err) => logger.important.error(`Unhandled Exception, (${err.stack})`))
        .on("unhandledRejection", (reason) => logger.important.error(`Unhandled Rejection, (${reason.stack})`))
}

/* Sets the users IP for later simpler use */
/* Also Logs the requested path */
app.use((req, res, next) => {
    req.clientIp = (req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.ip).replace("::ffff:", "");

    if (req.path == "/favicon.ico") return res.send(fs.readFileSync("./assets/logo.png"));

    logger.info(`${req.clientIp} Requested ${req.path} (${req.method})`)

    next();
})

const routes = routeHandler(app) // The route handler (Everything below comes after, Put routes above for them to come first)

require("./test")(app);

/* If the path does not exist */
app.all("*", (req, res) => {
    logger.warn(`${req.clientIp} Requested a path that does not exist (${req.path})`)

    res.status(404).send({
        code: 404,
        errors: [{
            code: "PATH_DOESNT_EXIST",
            message: "The path you have requested does not exist."
        }]
    })

    return;
})


app.listen((config.Server.port || 62250), async () => {
    logger.important.info(`Server Started On Port ${config.Server.port || 62250}`);

    await redis.createClient().then(() => logger.important.info("Redis connected!")).catch((e) => {
        logger.important.error("Failed to connect to Redis", e);
        process.exit();
    })

    await mongoose.connect(uriGenerator(), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        keepAlive: true
    }).then(() => logger.important.info("MongoDB connected!")).catch((e) => {
        logger.important.error("Failed to connect to MongoDB", e);
        process.exit();
    });

    if (config.Logger.logInfo) logger.important.info(`${config.Logger.timeStartUp ? `Took ${(Math.round(Date.now() - timeStarted) / 1000).toFixed(2)}s to Start Up, ` : ""}Loaded ${routes.length} Routes, Running Version ${config.Misc.kas_version ? `v${config.Misc.kas_version}` : "Unknown version"}`)
    if (!config.Logger.logInfo && config.Logger.timeStartUp) logger.important.info(`Took ${(Math.round(Date.now() - timeStarted) / 1000).toFixed(3)}s to Start Up`)
})