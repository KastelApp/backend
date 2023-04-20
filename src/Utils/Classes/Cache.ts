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

import * as redis from 'redis';

/**
 * Caching System to make HTTP requests faster
 */
export class Cache {
    redis!: redis.RedisClientType;
    pingInterval: any;
    lastPing: any;
    waitingOnPing: boolean;
    host: string;
    port: number;
    password: string;
    user: string;
    database: number;
    /**
     * The Caching Settings
     * @param {string} [host=127.0.0.1] The Redis Host
     * @param {number|string} [port=6379] The port the host is listening on
     * @param {string} [user=default] The user (The default user is 'default')
     * @param {string} [password=null] The Password (If one is required if not put null)
     * @param {number|string} [database] The Database (Default is 0)
     */
    constructor(host: string, port: number | string, user: string, password: string, database: number | string) {

        this.host = (host ? host : '127.0.0.1');

        this.port = Number(port ? port : 6379);

        this.password = (password ? password : '');

        this.user = (user ? user : '');

        this.database = Number(database ? database : 0);

        if (isNaN(this.port) || isNaN(this.database)) {
            const typeIssues = `${isNaN(this.port) ? isNaN(this.database) ? '"port" and "database" is expected to be numbers got NaN' : '"port" is expected to be number, got NaN' : isNaN(this.database) ? '"database" is expected to be number, got NaN' : 'Unknown Type Issue'}`;
            throw new TypeError(typeIssues);
        }

        Object.defineProperty(this, 'redis', {
            value: undefined,
            writable: true,
            enumerable: false,
            configurable: false
        });

        /**
         * @private
         * @type {setInterval}
         */
        this.pingInterval;

        /**
         * @private
         * @type {number}
         */
        this.lastPing = null;

        /**
         * @private
         * @type {boolean}
         */
        this.waitingOnPing = false;
    }

    /**
     * Connect to the Redis Client
     * @returns {Promise<redis.RedisClientType>} The Redis Client
     */
    connect(): Promise<redis.RedisClientType> {
        return new Promise((resolve, reject) => {
            if (this.redis) {
                reject('You are already connected to redis');
            }

            this.redis = redis.createClient({
                url: `redis://${this.user}:${encodeURIComponent(this.password)}@${this.host}:${this.port}`,
                database: this.database,
            });

            this.redis.on('ready', () => {
                resolve(this.redis);

                this.pingInterval = setInterval(() => {
                    if (Math.floor(Date.now() - this.lastPing) > 15000 && this.lastPing) {
                        console.error(`Redis Failed to respond to an ping, Exiting... (Last Ping: ${(new Date(this.lastPing)).toLocaleString()})`);
                        process.exit();
                    } else if (this.waitingOnPing == false) {
                        this.waitingOnPing = true;
                        this.redis.ping().then((x) => {
                            if (process.env.rd) console.debug('Redis Info', x, x == 'PONG');
                            if (x == 'PONG') this.lastPing = Date.now();
                            this.waitingOnPing = false;
                        });
                    } else {
                        if (process.env.rd) console.debug('Currently waiting on a ping to finish.');
                        return;
                    }
                }, 5000);
            });
            this.redis.on('error', (e) => reject(e));

            this.redis.connect();
        });
    }

    /**
     * Checks if a key is cached or not
     * @param {string} variable The variable (variable:key) or just the key you want to check
     * @param {string} [key] The key you want to check is cached
     * @returns {Promise<Boolean>} If its cached or not
     */
    isCached(variable: string, key?: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.redis.get(`${key ? `${variable}:${key}` : variable}`)
                .then((x) => {
                    if (x) resolve(true);
                    else resolve(false);
                })
                .catch(() => resolve(false));
        });
    }


    set(variable: string, key: string, item?: string): Promise<'OK'> {

        if ((key && item) && typeof item !== 'string') {
            if (typeof item == 'object') item = JSON.stringify(item);
            else item = String(item);
        } else if (typeof key !== 'string') {
            if (typeof key == 'object') key = JSON.stringify(key);
            else key = String(key);
        }

        return new Promise((resolve, reject) => {
            this.redis
                .set(`${key && item ? `${variable}:${key}` : variable}`, `${item ? item : key}`)
                .then(() => resolve('OK'))
                .catch((e) => reject(e));
        });
    }

    get(variable: string, key?: string): Promise<string | null> {
        return new Promise((resolve, reject) => {
            this.redis.get(`${key ? `${variable}:${key}` : variable}`)
                .then((x) => resolve(x))
                .catch((e) => reject(e));
        });
    }

    keys(variable: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.redis.keys(`${variable ? `${variable}:*` : '*'}`)
                .then((x) => resolve(x))
                .catch((er) => reject(er));
        });
    }

    reset(variable: string, key?: string, item?: string) {
        return new Promise((resolve, reject) => {
            const multi = {
                key: (key && item ? `${variable}:${key}` : variable),
                item: (item ? item : key),
            };

            if (typeof multi.item !== 'string') {
                if (typeof multi.item == 'object') multi.item = JSON.stringify(multi.item);
                else multi.item = String(multi.item);
            }

            this.redis.del(multi.key).catch((er) => reject(er));
            this.redis.set(multi.key, multi.item).then((x) => resolve(x)).catch((er) => reject(er));
        });
    }

    delete(key: string): Promise<number | void> {
        return new Promise((resolve, reject) => {
            this.redis.del(key)
                .catch((er) => reject(er))
                .then((x) => resolve(x));
        });
    }

    /**
     * Clears the Cache of everything, Useful for starting it up.
     * @param {string|string[]} ignore What Vars to ignore
     * @returns {Promise<string[]>} The Array of keys that were deleted
     */
    clear(ignore?: string | string[]): Promise<string[]> {
        return new Promise((resolve, reject) => {
            this.redis.keys('*').then((RedisKeys) => {
                for (const key of RedisKeys) {
                    if (Array.isArray(ignore)) {
                        const keys = key.split(':')[0];
                        if (ignore.includes(keys as string)) continue;
                    } else if (typeof ignore == 'string') {
                        if (key.split(':')[0] == ignore) continue;
                    }

                    this.redis.del(key);
                }
                if (ignore) {
                    const NotIgnored: string[] = [];

                    for (const e of RedisKeys) {
                        if (Array.isArray(ignore)) {
                            const keys = e.split(':')[0];
                            if (ignore.includes(keys as string)) continue;
                        } else if (typeof ignore == 'string') {
                            if (e.split(':')[0] == ignore) continue;
                        }
                        NotIgnored.push(e);
                    }
                    resolve(NotIgnored);
                } else {
                    resolve(RedisKeys);
                }
            }).catch((er) => reject(er));
        });
    }
}