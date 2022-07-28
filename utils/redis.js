const redis = require("redis");

/**
 * @type {import('redis').RedisClientType}
 */
let redisClient = null;


/**
 * The redis class, Less code and keeps typings
 */
class Redis {

    /**
     * Creates the redis client
     * @returns {Promise<import("redis").RedisClientType>}
     */
    static createClient() {
        Redis.clientCheck(false);

        return new Promise((resolve, reject) => {
            redisClient = redis.createClient({
                url: `redis://default:${process.env.rpassword}@${process.env.rhost}:${process.env.rport}`,
                database: process.env.rdb,
            });

            redisClient.on("ready", () => resolve(redisClient));
            redisClient.on("error", (e) => reject(e));

            redisClient.connect();
        })
    }

    /**
     * Set a key in the redis client
     * @param {String} key The key to set 
     * @param {*} item The item to set
     * @returns {Promise<"OK">}
     */
    static set(key, item) {
        Redis.clientCheck(true);

        return new Promise((resolve, reject) => {
            if (!item) reject("No item provided");
            if (typeof item == "object") item = JSON.stringify(item);

            redisClient.set(key, item).then((v) => resolve(v)).catch((e) => reject(e))
        });
    }

    /**
     * Gets a key from the database and returns it
     * @param {String} key 
     * @returns {Promise<String>}
     */
    static get(key) {
        Redis.clientCheck(true);

        return new Promise((resolve, reject) => redisClient.get(key).then((v) => resolve(v)).catch((e) => reject(e)));
    }


    // N/A, Not Finished.
    static search() {
        Redis.clientCheck(true);

        return new Promise((resolve, reject) => {})
    }


    /**
     * Deletes a key from the database
     * @param {String} key 
     * @returns {Promise<Boolean>}
     */
    static delete(key) {
        Redis.clientCheck(true);

        return new Promise((resolve, reject) => redisClient.del(key).then((v) => resolve(v)).catch((e) => reject(e)));
    }

    /**
     * @returns {import("redis").RedisClientType}
     */
    static get redisClient() {
        Redis.clientCheck(true);

        return redisClient;
    }

    /**
     * @private
     * @param {Boolean} boolean if boolean is true then it will throw a error if redisClient is null or will do nothing if its the redis client 
     */
    static clientCheck(boolean) {
        if (!redisClient && boolean == true) throw new Error("Please create the client.");

        if (redisClient && boolean == false) throw new Error("The client is already created.");
    }
}

module.exports = Redis