import type { NextFunction, Request, Response } from "express";

const API_PREFIX_TRAILING_SLASH = /^\/api(\/v\d+)?\//;

type RateLimitData = {
  id: "global" | "error" | string;
  executorId: string;
  hits: number;
  blocked: boolean;
  expiresAt: Date;
  failedHits: number;
};

const RateLimitCache = new Map<string, RateLimitData>();
// const RateLimitEvent = "RATELIMIT";

interface RateLimitOptions {
  bucket?: string;
  window: number; // in ms
  count: number;
  bot?: {
    inherit?: boolean; // if we should inherit the count from the normal count if so the other counts below this will be ignored
  };
  MODIFY?: number;
  error?: boolean;
  success?: boolean;
  onlyIp?: boolean; // if only the ip should be used to rate limit
  failed?: {
    boosts: {
      count: number; // if you get this many failed hits, then you get boosted by Y
      boost: number; // So if you get 5 failed hits, then you get an extra 5 seconds (in ms)
    },
    remover: {
      count: number; // if you get this many failed hits then you loose X amount of tokens
      remove: number; // So if you get 5 failed hits, then you loose 5 tokens
    }
  }
}

export default function rateLimit(options: RateLimitOptions) {
  return async function (req: Request, res: Response, next: NextFunction) {
    const bucketId = options.bucket || req.originalUrl.replace(API_PREFIX_TRAILING_SLASH, "");
    
    let executorId = req.clientIp;
    if (!options.onlyIp && req.user.Id) executorId = req.user.Id;

    let maxHits = options.count;
    // if (options.bot && req.user.Bot) maxHits = options.bot;
    // if (options.GET && ["GET", "OPTIONS", "HEAD"].includes(req.method)) maxHits = options.GET;
    // else if (options.MODIFY && ["POST", "DELETE", "PATCH", "PUT"].includes(req.method)) maxHits = options.MODIFY;

    const offender = RateLimitCache.get(executorId + bucketId);
    if (offender) {
      const resetAfterMs = offender.expiresAt.getTime() - Date.now();
      if (resetAfterMs <= 0) {
        offender.hits = 0;
        offender.expiresAt = new Date(Date.now() + options.window);
        offender.blocked = false;
        // RateLimitCache.delete(executorId + bucketId);
      }

      // console.log(options.failed, options.failed?.count, options.failed?.boost, offender.failedHits, offender.failedHits >= (options.failed?.count || 0))
      // if (options.failed?.count && offender.failedHits >= options.failed.count) {
        // offender.expiresAt = new Date(Date.now() + (options.window + options.failed.boost));
        // offender.failedHits = 0;
      // }

      if (offender.blocked) {
        const global = bucketId === "global";
        const resetAfterSec = resetAfterMs / 1000;
        
        console.log(`blocked bucket: ${bucketId} ${executorId}`, resetAfterMs);

        offender.failedHits++

        res
          .status(429)
          .set({
            "X-RateLimit-Limit": `${maxHits}`,
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": `${offender.expiresAt.getTime()}`,
            "X-RateLimit-Reset-After": `${resetAfterSec}`,
            "X-RateLimit-Global": `${global}`,
            "Retry-After": `${Math.ceil(resetAfterSec)}`,
            "X-RateLimit-Bucket": `${bucketId}`
          })
          .send({
            Message: "You are being rate limited.",
            RetryAfter: resetAfterSec,
            Global: global,
          });
        return;
      }
    }

    next();

    
    if (options.error || options.success) {
      res.once("finish", () => {
        console.log('huh')
        if (res.statusCode >= 400 && options.error) {
          console.log('error')
          hitRoute({ bucketId, executorId, maxHits, window: options.window, failed: true });
        }
        else if (res.statusCode >= 200 && res.statusCode < 300) { // && options.success) {
          console.log('success')
          hitRoute({ bucketId, executorId, maxHits, window: options.window, failed: false });
        }
      });
    } else {
      hitRoute({ bucketId, executorId, maxHits, window: options.window, failed: false });
    }
  };
}



// export async function initRateLimits(app: Router) {
//   const { routes, global, ip, error, enabled } = Config.get().limits.rate;
//   if (!enabled) return;
//   console.log("Enabling rate limits...");
//   await listenEvent(EventRateLimit, (event) => {
//     Cache.set(event.channel_id as string, event.data);
//     event.acknowledge?.();
//   });
//   // await RateLimit.delete({ expires_at: LessThan(new Date().toISOString()) }); // cleans up if not already deleted, morethan -> older date
//   // const limits = await RateLimit.find({ blocked: true });
//   // limits.forEach((limit) => {
//   // 	Cache.set(limit.executor_id, limit);
//   // });

//   setInterval(() => {
//     Cache.forEach((x, key) => {
//       if (new Date() > x.expires_at) {
//         Cache.delete(key);
//         // RateLimit.delete({ executor_id: key });
//       }
//     });
//   }, 1000 * 60);

//   app.use(
//     rateLimit({
//       bucket: "global",
//       onlyIp: true,
//       ...ip,
//     })
//   );
//   app.use(rateLimit({ bucket: "global", ...global }));
//   app.use(
//     rateLimit({
//       bucket: "error",
//       error: true,
//       onlyIp: true,
//       ...error,
//     })
//   );
//   app.use("/guilds/:id", rateLimit(routes.guild));
//   app.use("/webhooks/:id", rateLimit(routes.webhook));
//   app.use("/channels/:id", rateLimit(routes.channel));
//   app.use("/auth/login", rateLimit(routes.auth.login));
//   app.use(
//     "/auth/register",
//     rateLimit({ onlyIp: true, success: true, ...routes.auth.register })
//   );
// }

async function hitRoute(opts: {
  bucketId: string;
  executorId: string;
  maxHits: number;
  window: number;
  failed: boolean;
}) {
  const id = opts.executorId + opts.bucketId;

  let limit = RateLimitCache.get(id);

  if (!limit) {
    limit = {
      id: opts.bucketId,
      executorId: opts.executorId,
      expiresAt: new Date(Date.now() + opts.window),
      hits: 0,
      blocked: false,
      failedHits: opts.failed ? 1 : 0,
    };

    RateLimitCache.set(id, limit);
  }

  limit.hits++;

  if (opts.failed) {
    limit.failedHits++;
  }

  if (limit.hits >= opts.maxHits) {
    limit.blocked = true;
  }

  console.log(limit);

  /*
	let ratelimit = await RateLimit.findOne({ where: { id: opts.bucket_id, executor_id: opts.executor_id } });
	if (!ratelimit) {
		ratelimit = new RateLimit({
			id: opts.bucket_id,
			executor_id: opts.executor_id,
			expires_at: new Date(Date.now() + opts.window * 1000),
			hits: 0,
			blocked: false
		});
	}
	ratelimit.hits++;
	const updateBlock = !ratelimit.blocked && ratelimit.hits >= opts.max_hits;
	if (updateBlock) {
		ratelimit.blocked = true;
		Cache.set(opts.executor_id + opts.bucket_id, ratelimit);
		await emitEvent({
			channel_id: EventRateLimit,
			event: EventRateLimit,
			data: ratelimit
		});
	} else {
		Cache.delete(opts.executor_id);
	}
	await ratelimit.save();
	*/
}


// setInterval(() => {
//   console.log(RateLimitCache)
// }, 1000)