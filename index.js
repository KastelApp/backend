require("dotenv").config();
require("./utils/dotenvParser").parse();

// If the user wants to time the startup
process?.env?.timeStartUp ? (timeStarted = Date.now()) : null

/* Misc Imports */
const { default: mongoose } = require("mongoose");
const chalk = require("chalk")

if (process?.env?.logLogo) {
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
const bodyParser = require("body-parser");

/* Util Imports */
const redis = require("./utils/classes/redis");
const routeHandler = require("./utils/routeHandler");
const id = require("./utils/classes/idGen");
const uriGenerator = require("./utils/uriGenerator");
const logger = require("./utils/classes/logger");
const fs = require("node:fs");


/* Express Middleware stuff */
const app = express()

app.use(cors())
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .use(cookieParser(process.env.cookieSecrets));

/* Error Handling */
process.on("uncaughtException", (err) => logger.important.error(`Unhandled Exception, (${err.stack})`))
    .on("unhandledRejection", (reason) => logger.important.error(`Unhandled Rejection, (${reason.stack})`))

/* Sets the users IP for later simpler use */
/* Also Logs the requested path, Returns on favicon.ico as its no use logging it */
app.use((req, res, next) => {
    req.clientIp = (req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.ip).replace("::ffff:", "");

    if (req.path == "/favicon.ico") return res.send(fs.readFileSync("./assets/logo.png"));

    logger.info(`${req.clientIp} Requested ${req.path} (${req.method})`)

    next();
})

expressWs(app) // Setup Websocket stuff
routeHandler(app) // The route handler (Everything below comes after, Put routes above for them to come first)

/* If the path does not exist logs it */
app.all("*", (req, res) => {
    logger.warn(`${req.clientIp} Requested a path that does not exist (${req.path})`)

    res.status(404).send({
        code: 404,
        errors: [{
            code: "PATH_DOESNT_EXIST",
            message: "The path you have requested does not exist."
        }]
    })
})


app.listen((process.env.port || 62250), async () => {
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

    id.setup({ // sets up the ID generator
        epoch: process.env.epoch,
        workerId: process.env.workerId,
        datacenterId: process.env.datacenterId,
        workerId_Bytes: process.env.workerId_Bytes,
        datacenterId_Bytes: process.env.datacenterId_Bytes,
        sequence: process.env.sequence,
        sequence_Bytes: process.env.sequence_Bytes,
    })

    if (process.env.timeStartUp) logger.important.info(`Took ${(Math.round(Date.now() - timeStarted) / 1000).toFixed(3)}s to Start Up`)
})