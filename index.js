const processVersion = process.version.slice(process.version.startsWith("v") ? 1 : 0, (process.version.length - 2))

if (processVersion < 16) {
    throw new Error(`Kastel requires at least Node.js v16.0.0, You are running on ${process.version}`)
}

require("dotenv").config();

// If the user wants to time the startup
process?.env?.timeStartUp == "true" ? (timeStarted = Date.now()) : null

/* Misc Imports */
const { default: mongoose } = require("mongoose");
const chalk = require("chalk")

if (JSON.parse(process?.env?.logLogo)) {
    console.log(chalk.yellow(`
██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     
██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     
█████╔╝ ███████║███████╗   ██║   █████╗  ██║     
██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     
██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
A Privacy focused chatting app
Running version ${process?.env?.kas_version ? `v${process?.env?.kas_version}` : "Unknown version"} of Kastel. Node.js version ${process.version}
`))
}


/* Express Imports */
const express = require('express');
const expressWs = require("express-ws")
const cors = require("cors");
const cookieParser = require("cookie-parser");


/* Util Imports */
const redis = require("./utils/redis");
const routeHandler = require("./utils/routeHandler");
const { setup } = require("./utils/idGen");
const uriGenerator = require("./utils/uriGenerator");
const log = require("./utils/logger");

global.logger = new log("default");

/* Express Middleware stuff */
const app = express()

app.use(cors())
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use(cookieParser());

/* Error Handling */
process.on("uncaughtException", (err) => {
    logger.important.error(`Unhandled Exception, (${err.stack})`)
})

process.on("unhandledRejection", (reason) => {
    logger.important.error(`Unhandled Rejection, (${reason.stack})`)
})

/* Sets the users IP for later simpler use */
/* Also Logs the requested path, Returns on favicon.ico as its no use logging it */
app.use((req, res, next) => {
    req.user_ip = (req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.ip).replace("::ffff:", "");

    if (req.path == "/favicon.ico") return res.send(null);

    logger.info(`${req.user_ip} Requested ${req.path} (${req.method})`)

    next();
})

expressWs(app) // Setup Websocket stuff
routeHandler(app) // The route handler (Everything below comes after, Put routes above for them to come first)

/* If the path does not exist logs it */
app.all("*", (req, res) => {
    logger.warn(`${req.user_ip} Requested a path that does not exist (${req.path})`)

    res.status(404).send({
        code: 404,
        errors: [{
            code: "PATH_DOESNT_EXIST",
            message: "The path you have requested does not exist."
        }]
    })
})


app.listen((process.env.port || 3000), async () => {
    logger.important.info(`Server Started On Port ${process.env.port || 3000}`);

    await redis.createClient().then(() => logger.important.info("Redis connected!")).catch((e) => {
        logger.important.error("Failed to connect to Redis,", e);
        process.exit();
    })

    await mongoose.connect(uriGenerator(), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        keepAlive: true
    }).then(() => logger.important.info("MongoDB connected!")).catch((e) => {
        logger.important.error("Failed to connect to MongoDB", e);
        process.exit();
    })

    setup({ // sets up the new ID generator
        epoch: process.env.epoch,
        workerId: process.env.workerId,
        datacenterId: process.env.datacenterId,
        workerId_Bytes: process.env.workerId_Bytes,
        datacenterId_Bytes: process.env.datacenterId_Bytes,
        sequence: process.env.sequence,
        sequence_Bytes: process.env.sequence_Bytes,
    })

    if (JSON.parse(process.env.timeStartUp)) logger.important.info(`Took ${(Math.round(Date.now() - timeStarted) / 1000).toFixed(3)}s to Start Up`)
})