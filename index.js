require("dotenv").config();

/* The Logger Imports */
const alphalogger = require("alphalogger/logger");
global.logger = new alphalogger("default")

process.on("uncaughtException", (err, stack) => {
    logger.error(`Unhandled Exception, (${err.stack})`)
})

process.on("unhandledRejection", (reason) => {
    logger.error(`Unhandled Rejection, (${reason})`)
})

/* Express Imports */
const express = require('express');
const expressWs = require("express-ws")
const cors = require("cors");
const cookieParser = require("cookie-parser");

/* Util Imports */
const redis = require("./utils/redis");
const routeHandler = require("./utils/routeHandler");
const { set } = require("./utils/redis");
const { SchemaFieldTypes } = require("redis");

/* Express Middleware stuff */
const app = express()

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

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

    res.send({
        error: true,
        code: 404,
        message: `${req.path} not found.`
    })
})


app.listen((process.env.port || 3000), async () => {
    logger.info(`Server Started On Port ${process.env.port || 3000}`);

    await redis.createClient().then(() => logger.info("Redis Server Connected")).catch((e) => {
        logger.error("Failed to connect to Redis,", e)
        process.exit()
    })
})