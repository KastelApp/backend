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

import { Config } from "./Config";
import Constants, { Relative } from "./Constants";

/* Misc Imports */
import mongoose from "mongoose";
import chalk from "chalk";

console.log(
  chalk.hex("#ca8911")(`
██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     
██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     
█████╔╝ ███████║███████╗   ██║   █████╗  ██║     
██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     
██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
A Chatting Application
Running version ${
    Relative.Version ? `v${Relative.Version}` : "Unknown version"
  } of Kastel's Backend. Node.js version ${process.version}
If you would like to support this project please consider donating to https://opencollective.com/kastel\n`)
);

/* Express Imports */
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

/* Util Imports */
import { uriGenerator } from "./Utils/UriGenerator";
import { HTTPErrors, Snowflake} from "@kastelll/util";
import { Route } from "@kastelll/core";
import { join } from "node:path";
const Routes = Route.LoadRoutes(join(__dirname, "routes"));
import { Cache } from "./Utils/Classes/Cache";
import { IpUtils } from "./Utils/Classes/IpUtils";
import Turnstile from "./Utils/Classes/Turnstile";
import RequestUtils from "./Utils/Classes/RequestUtils";
import SystemSocket from "./Utils/Classes/System/SystemSocket";
import Emails from "./Utils/Classes/Emails";
import * as Sentry from "@sentry/node";

/* Express Middleware stuff */
const app = express();

const FourOhFourError = new HTTPErrors(404, {
  routes: {
    code: "RouteNotFound",
    message: "The route you requested does not exist.",
  },
}).toJSON();

app
  .use(cors())
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .use(bodyParser.raw())
  .use(cookieParser(Config.Server.CookieSecrets))
  .disable("x-powered-by");

if (Config.Server.Sentry.Enabled) {
  Sentry.init({
    ...Config.Server.Sentry.OtherOptions,
    dsn: Config.Server.Sentry.Dsn,
    tracesSampleRate: Config.Server.Sentry.TracesSampleRate,
    // I have no clue if this is setup right, anyways waffles are cool do not forget that
    integrations: (integrations) => {
      const Intergrations = [
        ...integrations.map((integration) => {
          if (integration.name === "OnUncaughtException") {
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

      return Intergrations;
    },
  });
}

/* Error Handling */
process
  .on("uncaughtException", (err) => {
    if (Config.Server.Sentry.Enabled) {
      Sentry.captureException(err);
    }
    console.error(`Uncaught Exception, \n${err?.stack ? err.stack : err}`);
  })
  .on("unhandledRejection", (reason: any) => {
    if (Config.Server.Sentry.Enabled) {
      Sentry.captureException(reason);
    }
    console.error(
      `Unhandled Rejection, \n${reason?.stack ? reason.stack : reason}`
    );
  });

/* Sets the users IP, Setups Captcha & Utils */
/* Also Logs the requested path */



if (Config.Server.Sentry.Enabled) {
  app.use(
    Sentry.Handlers.requestHandler({
      ...Config.Server.Sentry.RequestOptions,
    })
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
      error: {
        code: "ServiceUnavailable",
        message: "The service is currently unavailable.",
      },
    });

    return;
  }
  
  if (Config.Server.StrictRouting && req.path.length > 1 && req.path.endsWith("/")) {
    res.status(404).json(FourOhFourError);
  
    return;
  }

  // Client IP is just different headers to get the actual IP of the user
  req.clientIp = IpUtils.GetIp(req);

  // Captcha is a Turnstile class that is for verifying captchas
  req.captcha = new Turnstile();

  // Utils is a few utils for easily fetching data. This is so we can have less repeated code :D
  req.utils = new RequestUtils(req, res);

  console.info(`[Stats] ${req.clientIp} Requested ${req.path} (${req.method})`);

  res.on("finish", () => {
    console.info(
      `[Stats] ${req.clientIp} Requested ${req.path} (${req.method}) - ${res.statusCode}`
    );
  });
  
  next();
});

Route.SetRoutes(app);

/* If the path does not exist */
app.all("*", (req, res) => {
  console.warn(
    `[Stats] ${req.clientIp} Requested ${req.path} That does does not exist with the method ${req.method}`
  );

  res.status(404).json(FourOhFourError);

  return;
});

app.listen(Config.Server.Port || 62250, async () => {
  app.ready = false;
  console.info(
    `[Express] Server Started On Port ${Config.Server.Port || 62250}`
  );

  const cache = new Cache(
    Config.Redis.Host,
    Config.Redis.Port,
    Config.Redis.User,
    Config.Redis.Password,
    Config.Redis.Db
  );

  await cache
    .connect()
    .then(() => console.info("[Cache] Redis connected!"))
    .catch((e: any) => {
      console.error("[Cache] Failed to connect to Redis", e);
      process.exit();
    });

  let cleared = [];

  if (Config.Server.Cache.ClearOnStart)
    cleared = await cache.clear("ratelimits");

  setInterval(async () => {
    // NOTE WE ARE NOT CLEARING RATELIMITS WE ARE CLEARING EVERYTHING BUT RATELIMITS
    // This is because we want to keep the ratelimits in cache so we can check them
    const clearedKeys = await cache.clear("ratelimits");
    console.info(`[Cache] Cleared ${clearedKeys.length} keys from Cache`);
  }, Config.Server.Cache.ClearInterval || 10800000);

  app.cache = cache;

  mongoose.set("strictQuery", true);

  await mongoose.connect(uriGenerator()).catch((e: any) => {
    console.error("[Database] Failed to connect to MongoDB", e);
    process.exit();
  });

  console.info("[Database] MongoDB connected!");

  const Socket = new SystemSocket();

  await Socket.Connect();

  app.socket = Socket;
  

  if (Config.MailServer.Enabled) {
    const Support = Config.MailServer.Users.find(
      (u) => u.ShortCode === "Support"
    );
    const NoReply = Config.MailServer.Users.find(
      (u) => u.ShortCode === "NoReply"
    );

    if (!Support || !NoReply) {
      console.error("[Mail] Missing Support or NoReply user in config");
      console.error("[Mail] Disable MailServer in config to ignore this error");
      process.exit();
    }

    app.request.Support = new Emails(
      Support.Host,
      Support.Port,
      Support.Secure,
      Support.User,
      Support.Password
    );

    app.request.NoReply = new Emails(
      NoReply.Host,
      NoReply.Port,
      NoReply.Secure,
      NoReply.User,
      NoReply.Password
    );

    try {
      await app.request.Support.Connect();
      await app.request.NoReply.Connect();
    } catch (e) {
      console.error("[Mail] Failed to connect to Mail Server", e);
      process.exit();
    }

    console.info("[Mail] Mail Server connected!");
  } else {
    console.info("[Mail] Mail Server disabled!");

    app.request.Support = null;

    app.request.NoReply = null;
  }
  
  app.snowflake = new Snowflake(Constants.Snowflake)

  console.info(
    `[Stats] Took ${(Math.round(Date.now() - timeStarted) / 1000).toFixed(
      2
    )}s to Start Up, Loaded ${Routes.length} Routes, Running Version ${
      Constants.Relative.Version
        ? `v${Constants.Relative.Version}`
        : "Unknown version"
    }, Cleared ${cleared.length} keys from cache`
  );

  app.ready = true;
});
