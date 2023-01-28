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

const redis = require('redis');
const logger = require('./logger');

/**
 * Caching System to make HTTP requests faster
 */
class Cache {
    /**
     * The Caching Settings
     * @param {string} [host=127.0.0.1] The Redis Host
     * @param {number|string} [port=6379] The port the host is listening on
     * @param {string} [user=default] The user (The default user is 'default')
     * @param {string} [password=null] The Password (If one is required if not put null)
     * @param {number|string} [database] The Database (Default is 0)
     */
    constructor(host, port, user, password, database) {

        /**
         * @private
         * @readonly
         * @type {string}
         */
        this._host = (host ? host : '127.0.0.1');
        /**
         * @private
         * @readonly
         * @type {number}
         */
        this._port = Number(port ? port : 6379);
        /**
         * @private
         * @readonly
         * @type {string}
         */
        this._password = (password ? password : '');
        /**
         * @private
         * @readonly
         * @type {string}
         */
        this._user = (user ? user : '');
        /**
         * @private
         * @readonly
         * @type {number}
         */
        this._database = Number(database ? database : 0);

        if (isNaN(this._port) || isNaN(this._database)) {
            const typeIssues = `${isNaN(this._port) ? isNaN(this._database) ? '"port" and "database" is expected to be numbers got NaN' : '"port" is expected to be number, got NaN' : isNaN(this._database) ? '"database" is expected to be number, got NaN' : 'Unknown Type Issue'}`;
            throw new TypeError(typeIssues);
        }

        /**
         * @private
         * @type {redis.RedisClientType}
         */
        this._redis;

        /**
         * @private
         * @type {setInterval}
         */
        this._pingInterval;

        /**
         * @private
         * @type {number}
         */
        this._lastPing = null;

        /**
         * @private
         * @type {boolean}
         */
        this._waitingOnPing = false;
    }

    /**
     * Connect to the Redis Client
     * @returns {Promise<redis.RedisClientType>} The Redis Client
     */
    connect() {
        return new Promise((resolve, reject) => {
            if (this._redis) {
                reject('You are already connected to redis');
            }

            this._redis = redis.createClient({
                url: `redis://${this._user}:${encodeURIComponent(this._password)}@${this._host}:${this._port}`,
                database: this._database,
            });

            this._redis.on('ready', () => {
                resolve(this._redis);

                this._pingInterval = setInterval(() => {
                    if (Math.floor(Date.now() - this._lastPing) > 15000 && this._lastPing) {
                        logger.error(`Redis Failed to respond to an ping, Exiting... (Last Ping: ${(new Date(this._lastPing)).toLocaleString()})`);
                        process.exit();
                    } else if (this._waitingOnPing == false) {
                        this._waitingOnPing = true;
                        this._redis.ping().then((x) => {
                            if (process.env.rd) logger.debug('Redis Info', x, x == 'PONG');
                            if (x == 'PONG') this._lastPing = Date.now();
                            this._waitingOnPing = false;
                        });
                    } else {
                        if (process.env.rd) logger.debug('Currently waiting on a ping to finish.');
                        return;
                    }
                }, 5000);
            });
            this._redis.on('error', (e) => reject(e));

            this._redis.connect();
        });
    }

    /**
     * Checks if a key is cached or not
     * @param {string} variable The variable (variable:key) or just the key you want to check
     * @param {string} [key] The key you want to check is cached
     * @returns {Promise<Boolean>} If its cached or not
     */
    isCached(variable, key) {
        return new Promise((resolve) => {
            this._redis.get(`${key ? `${variable}:${key}` : variable}`)
                .then((x) => {
                    if (x) resolve(true);
                    else resolve(false);
                })
                .catch(() => resolve(false));
        });
    }

    /**
     * Set a item into the database
     * @param {string} variable The variable (variable:key) or just the key you want to set
     * @param {string} [key] The key you want to set or the item you want to set with the variable
     * @param {string} [item] The item you want to set
     * @param {*} options Redis options if any
     */
    set(variable, key, item, ...options) {

        if ((key && item) && typeof item !== 'string') {
            if (typeof item == 'object') item = JSON.stringify(item);
            else item = String(item);
        } else if (typeof key !== 'string') {
            if (typeof key == 'object') key = JSON.stringify(key);
            else key = String(key);
        }

        return new Promise((resolve, reject) => {
            this._redis
                .set(`${key && item ? `${variable}:${key}` : variable}`, `${item ? item : key}`, { ...options })
                .then(() => resolve())
                .catch((e) => reject(e));
        });
    }

    /**
     * Gets a key if its cached
     * @param {string} variable The variable (variable:key) or just the key you want to get
     * @param {string} [key] The key you want to get
     * @returns {Promise<string>} The Data returned
     */
    get(variable, key) {
        return new Promise((resolve, reject) => {
            this._redis.get(`${key ? `${variable}:${key}` : variable}`)
                .then((x) => resolve(x))
                .catch((e) => reject(e));
        });
    }

    /**
     * Like Cache.keys and Cache.get
     * @param {string} key The key you want to get
     * @returns {Promise<string>} The Data returned
     */
    sget(key) {
        return new Promise((resolve, reject) => {
            if (!key) reject('Please provide a key');

            this._redis.keys(key)
                .then((x) => {
                    const resolveAble = [];
                    if (x && x.length > 0) {
                        if (x.length == 1) {
                            this._redis.get(x[0]).then((y) => {
                                resolve(y);
                            });
                        } else {
                            for (const k of x) {
                                this._redis.get(k).then((y) => resolveAble.push(y));
                            }
                            resolve(resolveAble);
                        }
                    }
                })
                .catch((e) => reject(e));
        });
    }

    /**
     * Like Cache.keys and Cache.get
     * @param {string} key The key you want to get
     * @returns {Promise<string>} The Data returned
     */
    kget(key) {
        return new Promise((resolve, reject) => {
            if (!key) reject('Please provide a key');

            this._redis.keys(key)
                .then((x) => {
                    const obj = {};

                    for (const k of x) {
                        obj[k] = k.split(':');
                    }

                    resolve(obj);
                })
                .catch((e) => reject(e));
        });
    }

    /**
     * Get all the keys from a variable or without one
     * @param {string} [variable] The variable you want to fetch as if any
     * @returns {Promise<string[]>} the keys that were gotten
     */
    keys(variable) {
        return new Promise((resolve, reject) => {
            this._redis.keys(`${variable ? `${variable}:*` : '*'}`)
                .then((x) => resolve(x))
                .catch((er) => reject(er));
        });
    }

    /**
     * Re-Sets a item into the database
     * @param {string} variable The variable (variable:key) or just the key you want to set
     * @param {string} [key] The key you want to set or the item you want to set with the variable
     * @param {string} [item] The item you want to set
     * @param {*} options Redis options if any
     * @returns {Promise<'OK'>} if it was re-set or not
     */
    reset(variable, key, item) {
        return new Promise((resolve, reject) => {
            const multi = {
                key: (key && item ? `${variable}:${key}` : variable),
                item: (item ? item : key),
            };

            if (typeof multi.item !== 'string') {
                if (typeof multi.item == 'object') multi.item = JSON.stringify(multi.item);
                else multi.item = String(multi.item);
            }

            this._redis.del(multi.key).catch((er) => reject(er));
            this._redis.set(multi.key, multi.item).then((x) => resolve(x)).catch((er) => reject(er));
        });
    }

    delete(key) {
        return new Promise((resolve, reject) => {
            this._redis.del(key)
                .catch((er) => reject(er))
                .then((x) => resolve(x));
        });
    }

    /**
     * Clears the Cache of everything, Useful for starting it up.
     * @param {string|string[]} ignore What Vars to ignore
     * @returns {Promise<string[]>} The Array of keys that were deleted
     */
    clear(ignore) {
        return new Promise((resolve, reject) => {
            this._redis.keys('*').then((x) => {
                for (const key of x) {
                    if (Array.isArray(ignore)) {
                        const keys = key.split(':')[0];
                        if (ignore.includes(keys)) continue;
                    } else if (typeof ignore == 'string') {
                        if (key.split(':')[0] == ignore) continue;
                    }

                    this._redis.del(key);
                }
                if (ignore) {
                    const n = [];

                    for (const e of x) {
                        if (Array.isArray(ignore)) {
                            const keys = e.split(':')[0];
                            if (ignore.includes(keys)) continue;
                        } else if (typeof ignore == 'string') {
                            if (e.split(':')[0] == ignore) continue;
                        }
                        n.push(e);
                    }
                    resolve(n);
                } else {
                    resolve(x);
                }
            }).catch((er) => reject(er));
        });
    }

    /**
     * Returns the Host used to connected to the redis client
     * @returns {string} The host
     */
    get host() {
        return this._host;
    }

    /**
     * Returns the Port
     * @returns {number} The port
     */
    get port() {
        return this._port;
    }

    /**
     * Returns the User if any
     * @returns {string} The user
     */
    get user() {
        return this._user;
    }

    /**
     * @returns {number} The Database
     */
    get database() {
        return this._database;
    }

    /**
     * @private
     * @returns {string} The Password
     */
    get password() {
        return this._password;
    }
}

module.exports = Cache;