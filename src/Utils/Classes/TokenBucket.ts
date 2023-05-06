import { HTTPErrors } from '@kastelll/util';
import type { NextFunction, Request, Response } from 'express';

interface RateLimitData {
	Blocked: boolean;
	Bucket: string | 'error' | 'global';
	ExecutorId: string;
	ExpiresAt: Date;
	FailedHits: number;
	hits: number;
}

const RateLimitCache = new Map<string, RateLimitData>();

interface RateLimitOptions {
	Bot?: {
		inherit?: boolean; // if we should inherit the count from the normal count if so the other counts below this will be ignored
	};
	Bucket?: string;
	Count: number; // in ms
	Error?: boolean; // If we should should remove a token if the request was a 4xx or 5xx
	Failed?: {
		Boosts: {
			// if you get this many failed hits, then you get boosted by Y
			Boost: number;
			Count: number; // So if you get 5 failed hits, then you get an extra 5 seconds (in ms)
		};
		Remover: {
			Count: number; // if you get this many failed hits then you loose X amount of tokens
			Remove: number; // So if you get 5 failed hits, then you loose 5 tokens
		};
	};
	// if we should also check the ip address
	IpCheck?: boolean;
	Window: number;
}

const Hit = async (opts: { BucketId: string; ClientId: string; Failed: boolean; MaxHits: number; Window: number }) => {
	const BucketId = `${opts.ClientId}-${opts.BucketId}`;

	let Client = RateLimitCache.get(BucketId);

	if (!Client) {
		Client = {
			Bucket: opts.BucketId,
			ExecutorId: opts.ClientId,
			ExpiresAt: new Date(Date.now() + opts.Window),
			hits: 0,
			Blocked: false,
			FailedHits: opts.Failed ? 1 : 0,
		};

		RateLimitCache.set(BucketId, Client);
	}

	Client.hits++;

	if (opts.Failed) {
		Client.FailedHits++;
	}

	if (Client.hits >= opts.MaxHits) {
		Client.Blocked = true;
	}

	console.log(Client);
};

const RateLimit = (options: RateLimitOptions) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		const BucketId = options.Bucket ?? req.originalUrl.replace(/^\/api(?:\/v\d+)?\//, '');

		let ClientId = req.clientIp;
		const MaxHits = options.Count;

		if (!options.IpCheck && req.user.Id) ClientId = req.user.Id;

		// if (options.bot && req.user.Bot) maxHits = options.bot;

		const Client = RateLimitCache.get(`${ClientId}-${BucketId}`);

		if (Client) {
			const ResetAfterMs = Client.ExpiresAt.getTime() - Date.now();

			if (ResetAfterMs <= 0) {
				Client.hits = 0;
				Client.ExpiresAt = new Date(Date.now() + options.Window);
				Client.Blocked = false;
			}

			// console.log(options.Failed, options.Failed?.Count, options.Failed?.Boost, Client.FailedHits, Client.FailedHits >= (options.Failed?.Count || 0))
			// if (options.Failed?.Count && Client.FailedHits >= options.Failed.Count) {
			// Client.expiresAt = new Date(Date.now() + (options.Window + options.Failed.Boost));
			// Client.failedHits = 0;
			// }

			const IsGlobal = BucketId === 'global';
			const ResetAfterSecond = ResetAfterMs / 1_000;

			res.set({
				'X-RateLimit-Limit': `${MaxHits}`,
				'X-RateLimit-Remaining': `${MaxHits - Client.hits}`,
				'X-RateLimit-Global': `${IsGlobal}`,
				'X-RateLimit-Bucket': `${BucketId}`,
			});

			if (Client.Blocked) {
				console.log(`blocked: ${BucketId} ${ClientId}`, ResetAfterMs);

				Client.FailedHits++;

				const Error = new HTTPErrors(4_200, {
					RateLimit: {
						Message: 'You are being rate limited.',
						RetryAfter: ResetAfterSecond,
						Global: IsGlobal,
					},
				});

				res.set({
					'Retry-After': `${Math.ceil(ResetAfterSecond)}`,
					'X-RateLimit-Reset': `${Client.ExpiresAt.getTime()}`,
					'X-RateLimit-Reset-After': `${ResetAfterSecond}`,
				});

				res.status(429).json(Error.toJSON());

				return;
			}
		}

		if (options.Error) {
			res.once('finish', async () => {
				if (res.statusCode >= 400 && options.Error) {
					await Hit({ BucketId, ClientId, MaxHits, Window: options.Window, Failed: true });
				}
			});
		} else {
			await Hit({ BucketId, ClientId, MaxHits, Window: options.Window, Failed: false });
		}

		next();
	};
};

export default RateLimit;

export { RateLimitCache, type RateLimitData, type RateLimitOptions, RateLimit, Hit };
