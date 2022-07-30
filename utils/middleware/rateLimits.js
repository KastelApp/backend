const ms = require("ms");
const { jsonGet, jsonSet } = require("../redis");
/**
 * @param {Object} options
 * @param {Number} options.max The max amount of requests on the route
 * @param {Number} options.reset The amount of time it will take to reset to zero 
 */
const rateLimit = (options = {
    max: Infinity,
    reset: ms("1d")
}) => {
    return async (req, res, next) => {
        const requestedTime = Date.now();

        const userIP = await jsonGet(req.user_ip);

        if (!userIP) {
            const data = [{
                requestDate: requestedTime,
                requests: 1
            }];

            await jsonSet(req.user_ip, data)

            next()
        }
    }
}
module.exports = rateLimit