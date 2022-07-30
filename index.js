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
const { setup, generateId } = require("./utils/idGen");
const uriGenerator = require("./utils/uriGenerator");
const log = require("./utils/logger");

global.logger = new log("default");

/* Express Middleware stuff */
const app = express()

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* Error Handling */
process.on("uncaughtException", (err, stack) => {
    logger.error(`Unhandled Exception, (${err.stack})`)
})

process.on("unhandledRejection", (reason) => {
    logger.error(`Unhandled Rejection, (${reason.stack})`)
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
    logger.info(`Server Started On Port ${process.env.port || 3000}`);

    await redis.createClient().then(() => logger.info("Redis connected!")).catch((e) => {
        logger.error("Failed to connect to Redis,", e);
        process.exit();
    })

    await mongoose.connect(uriGenerator()).then(() => logger.info("MongoDB connected!")).catch((e) => {
        logger.error("Failed to connect to MongoDB", e);
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

    if (JSON.parse(process.env.timeStartUp)) logger.info(`Took ${(Math.round(Date.now() - timeStarted) / 1000).toFixed(3)}s to Start Up`)
})