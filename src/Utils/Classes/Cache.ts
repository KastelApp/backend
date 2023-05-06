/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable eqeqeq */
/* eslint-disable promise/prefer-await-to-then */
/* eslint-disable promise/prefer-await-to-callbacks */

// To Do: Rewrite this god awful code

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

import process from 'node:process';
import { setInterval } from 'node:timers';
import type { RedisClientType } from 'redis';
import { createClient } from 'redis';

/**
 * Caching System to make HTTP requests faster
 */
export class Cache {
	private redis!: RedisClientType;

	private pingInterval: any;

	private lastPing: any;

	private waitingOnPing: boolean;

	private readonly host: string;

	private readonly port: number;

	private readonly password: string;

	private readonly user: string;

	private readonly database: number;

	public constructor(host: string, port: number | string, user: string, password: string, database: number | string) {
		this.host = host ? host : '127.0.0.1';

		this.port = Number(port ? port : 6_379);

		this.password = password ? password : '';

		this.user = user ? user : '';

		this.database = Number(database ? database : 0);

		if (Number.isNaN(this.port) || Number.isNaN(this.database)) {
			const typeIssues = `${
				Number.isNaN(this.port)
					? Number.isNaN(this.database)
						? '"port" and "database" is expected to be numbers got NaN'
						: '"port" is expected to be number, got NaN'
					: Number.isNaN(this.database)
					? '"database" is expected to be number, got NaN'
					: 'Unknown Type Issue'
			}`;
			throw new TypeError(typeIssues);
		}

		Object.defineProperty(this, 'redis', {
			value: undefined,
			writable: true,
			enumerable: false,
			configurable: false,
		});

		this.pingInterval = null;

		this.lastPing = null;

		this.waitingOnPing = false;
	}

	public async connect(): Promise<RedisClientType> {
		// done
		return new Promise((resolve, reject) => {
			if (this.redis) {
				reject('You are already connected to redis');
			}

			this.redis = createClient({
				url: `redis://${this.user}:${encodeURIComponent(this.password)}@${this.host}:${this.port}`,
				database: this.database,
			});

			this.redis.on('ready', () => {
				resolve(this.redis);

				this.pingInterval = setInterval(() => {
					if (Math.floor(Date.now() - this.lastPing) > 15_000 && this.lastPing) {
						console.error(
							`Redis Failed to respond to an ping, Exiting... (Last Ping: ${new Date(this.lastPing).toLocaleString()})`,
						);
						process.exit();
					} else if (this.waitingOnPing === false) {
						this.waitingOnPing = true;
						this.redis.ping().then((x) => {
							if (process.env.rd) console.debug('Redis Info', x, x == 'PONG');
							if (x == 'PONG') this.lastPing = Date.now();
							this.waitingOnPing = false;
						});
					} else if (process.env.rd) console.debug('Currently waiting on a ping to finish.');
				}, 5_000);
			});
			this.redis.on('error', (err) => reject(err));

			this.redis.connect();
		});
	}

	public async isCached(variable: string, key?: string): Promise<boolean> {
		// done
		return new Promise((resolve) => {
			this.redis
				.get(`${key ? `${variable}:${key}` : variable}`)
				.then((key) => {
					if (key) resolve(true);
					else resolve(false);
				})
				.catch(() => resolve(false));
		});
	}

	public async set(variable: string, key: string, item?: string): Promise<'OK'> {
		// done
		if (key && item && typeof item !== 'string') {
			if (typeof item === 'object') item = JSON.stringify(item);
			else item = String(item);
		} else if (typeof key !== 'string') {
			if (typeof key === 'object') key = JSON.stringify(key);
			else key = String(key);
		}

		return new Promise((resolve, reject) => {
			this.redis
				.set(`${key && item ? `${variable}:${key}` : variable}`, `${item ? item : key}`)
				.then(() => resolve('OK'))
				.catch((error) => reject(error));
		});
	}

	public async get(variable: string, key?: string): Promise<string | null> {
		// done
		return new Promise((resolve, reject) => {
			this.redis
				.get(`${key ? `${variable}:${key}` : variable}`)
				.then((x) => resolve(x))
				.catch((error) => reject(error));
		});
	}

	public async keys(variable: string): Promise<string[]> {
		// done
		return new Promise((resolve, reject) => {
			this.redis
				.keys(`${variable ? `${variable}:*` : '*'}`)
				.then((x) => resolve(x))
				.catch((error) => reject(error));
		});
	}

	public async reset(variable: string, key?: string, item?: string) {
		// done
		return new Promise((resolve, reject) => {
			const multi = {
				key: key && item ? `${variable}:${key}` : variable,
				item: item ? item : key,
			};

			if (typeof multi.item !== 'string') {
				if (typeof multi.item === 'object') multi.item = JSON.stringify(multi.item);
				else multi.item = String(multi.item);
			}

			this.redis.del(multi.key).catch((error) => reject(error));
			this.redis
				.set(multi.key, multi.item)
				.then((x) => resolve(x))
				.catch((error) => reject(error));
		});
	}

	public async delete(key: string): Promise<number> {
		// done
		return new Promise((resolve, reject) => {
			this.redis
				.del(key)
				.catch((error) => reject(error))
				.then((res) => resolve(res as number));
		});
	}

	public async clear(ignore?: string[] | string): Promise<string[]> {
		// done
		return new Promise((resolve, reject) => {
			this.redis
				.keys('*')
				.then((RedisKeys) => {
					for (const key of RedisKeys) {
						if (Array.isArray(ignore)) {
							const keys = key.split(':')[0];
							if (ignore.includes(keys as string)) continue;
						} else if (typeof ignore === 'string' && key.split(':')[0] == ignore) continue;

						this.redis.del(key);
					}

					if (ignore) {
						const NotIgnored: string[] = [];

						for (const key of RedisKeys) {
							if (Array.isArray(ignore)) {
								const keys = key.split(':')[0];
								if (ignore.includes(keys as string)) continue;
							} else if (typeof ignore === 'string' && key.split(':')[0] === ignore) continue;
							NotIgnored.push(key);
						}

						resolve(NotIgnored);
					} else {
						resolve(RedisKeys);
					}
				})
				.catch((error) => reject(error));
		});
	}
}
