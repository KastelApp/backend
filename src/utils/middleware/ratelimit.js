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

const ms = require('ms');
const { completeDecryption } = require('../classes/encryption');
const logger = require('../classes/logger');
const UserFlags = require('../classes/BitFields/flags');
const defaultManager = require('../defaultManager');
const { routes } = require('../classes/Route');
const Snowflake = require('../classes/snowflake');

// Notes, This is a User Based **AND** IP Based Rate limiter.
// Changing your IP and using the same account will not let you bypass rate limits
// and changing accounts while using the same ip will also not yet you bypass it.

// To Do: Rate Limits should have a set limit but should also be dynamic,
// If Someone keeps hitting the max limit in a certain amount of time make the limit lower
// and the reset time longer

/**
 * A Simple Ratelimiter for Routes
 * @param {Options} options
 * @returns
 */
const ratelimit = (options = {
    requests: {
        max: 30,
        reset: ms('5m'),
    },
    flags: [],
}) => {
    /**
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     */
    return async (req, res, next) => {
        try {

            /**
             * @type {Options}
             */
            options = defaultManager({
                requests: {
                    max: 30,
                    reset: ms('5m'),
                },
                flags: [],
            }, options);

            /**
             * @type {import('../classes/Cache')}
             */
            const cache = req.app.cache;
            const user = req.user;
            const ip = req.clientIp;


            const foundRoute = routes.find((x) => {
                if (x.regex.test(req.path)) {
                    if (x.method.toLowerCase() == req.method.toLowerCase()) return true;
                    else return false;
                } else {
                    return false;
                }
            });

            if (!foundRoute) {
                logger.error('Unknown Route, Nexting them anyways');
                return next();
            }

            const userRateLimit = await cache.get('ratelimits:users', user.id);
            const ipRateLimit = await cache.get('ratelimits:ips', ip);

            res.setHeader('X-RateLimit-Limit', options.requests.max);

            if (user) {
                const usersFlags = new UserFlags((user.bit_flags || 0));

                // Mainly will be used for Staff (So they can test stuff or not have to worry about ratelimits)
                for (const flag of options.flags) {
                    if (usersFlags.has(flag.flag) && flag.bypass) {
                        return next();
                    } else {
                        continue;
                    }
                }

                if (userRateLimit) {
                    /**
                     * @type {RateLimitObject[]}
                     */
                    const userParsed = completeDecryption(JSON.parse(userRateLimit));

                    const routeData = userParsed.find((v) => {
                        if (new RegExp(v.regex).test(req.path) && req.method.toLowerCase() == v.method) return true;
                        else return false;
                    });

                    if (routeData) {
                        if (routeData.increment >= options.requests.max) {
                            const firstRequest = routeData.requests.find((x) => x.increment == 1);

                            if (Math.floor(Date.now() - firstRequest.date) > options.requests.reset) {
                                const updatedData = {
                                    ...routeData,
                                    increment: 1,
                                    lastRequest: Date.now(),
                                    requests: [{
                                        increment: 1,
                                        date: Date.now(),
                                    }],
                                };

                                const parsedFiltered = userParsed.filter((x) => x.id !== routeData.id);

                                parsedFiltered.push(updatedData);

                                res.setHeader('X-RateLimit-User-Remaining', (options.requests.max - 1));

                                await cache.reset('ratelimits:users', user.id, parsedFiltered);

                            } else {
                                res.setHeader('X-RateLimit-User-Reset', (Date.now() + ((firstRequest.date - Date.now()) + options.requests.reset)));
                                res.status(429).send({
                                    code: 429,
                                    errors: [{
                                        code: 'RATELIMIT_REACHED',
                                        message: `It seems you haved reached the rate limit of this endpoint, Please wait (${ms(((firstRequest.date - Date.now()) + options.requests.reset), { long:true })}) before accessing this endpoint Again.`,
                                    }],
                                    responses: [],
                                });

                                return;
                            }
                        } else {
                            const updatedData = {
                                ...routeData,
                                increment: (routeData.increment + 1),
                                lastRequest: Date.now(),
                                requests: [...routeData.requests, {
                                    increment: (routeData.increment + 1),
                                    date: Date.now(),
                                }],
                            };

                            const parsedFiltered = userParsed.filter((x) => x.id !== routeData.id);

                            res.setHeader('X-RateLimit-User-Remaining', (options.requests.max - updatedData.increment));

                            parsedFiltered.push(updatedData);

                            await cache.reset('ratelimits:users', user.id, parsedFiltered);
                        }
                    } else {
                        userParsed.push({
                            id: Snowflake.generate(),
                            method: req.method.toLowerCase(),
                            regex: foundRoute.regex.source,
                            increment: 1,
                            lastRequest: Date.now(),
                            requests: [{
                                increment: 1,
                                date: Date.now(),
                            }],
                        });

                        res.setHeader('X-RateLimit-User-Remaining', (options.requests.max - 1));

                        await cache.reset('ratelimits:users', user.id, userParsed);
                    }
                } else {
                    const data = [{
                        id: Snowflake.generate(),
                        method: req.method.toLowerCase(),
                        regex: foundRoute.regex.source,
                        increment: 1,
                        lastRequest: Date.now(),
                        requests: [{
                            increment: 1,
                            date: Date.now(),
                        }],
                    }];

                    res.setHeader('X-RateLimit-User-Remaining', (options.requests.max - 1));

                    await cache.set('ratelimits:users', user.id, data);
                }
            }

            if (ipRateLimit) {
                /**
                 * @type {RateLimitObject[]}
                 */
                const ipParsed = completeDecryption(JSON.parse(userRateLimit));

                const routeData = ipParsed.find((v) => {
                    if (new RegExp(v.regex).test(req.path) && req.method.toLowerCase() == v.method) return true;
                    else return false;
                });

                if (routeData) {
                    if (routeData.increment >= options.requests.max) {
                        const firstRequest = routeData.requests.find((x) => x.increment == 1);

                        if (Math.floor(Date.now() - firstRequest.date) > options.requests.reset) {
                            const updatedData = {
                                ...routeData,
                                increment: 1,
                                lastRequest: Date.now(),
                                requests: [{
                                    increment: 1,
                                    date: Date.now(),
                                  }],
                            };

                            const parsedFiltered = ipParsed.filter((x) => x.id !== routeData.id);

                            parsedFiltered.push(updatedData);

                            await cache.reset('ratelimits:ips', ip, parsedFiltered);

                        } else {
                            res.status(429).send({
                                code: 429,
                                errors: [{
                                    code: 'RATELIMIT_REACHED',
                                    message: `It seems you haved reached the rate limit of this endpoint, Please wait (${ms(((firstRequest.date - Date.now()) + options.requests.reset), { long:true })}) before accessing this endpoint Again.`,
                                      }],
                                responses: [],
                            });

                            return;
                        }
                    } else {
                        const updatedData = {
                            ...routeData,
                            increment: (routeData.increment + 1),
                            lastRequest: Date.now(),
                            requests: [...routeData.requests, {
                                increment: (routeData.increment + 1),
                                date: Date.now(),
                              }],
                        };

                        const parsedFiltered = ipParsed.filter((x) => x.id !== routeData.id);

                        parsedFiltered.push(updatedData);

                        await cache.reset('ratelimits:ips', ip, parsedFiltered);
                    }
                } else {
                    ipParsed.push({
                        id: Snowflake.generate(),
                        method: req.method.toLowerCase(),
                        regex: foundRoute.regex.source,
                        increment: 1,
                        lastRequest: Date.now(),
                        requests: [{
                            increment: 1,
                            date: Date.now(),
                          }],
                    });

                    await cache.reset('ratelimits:ips', ip, ipParsed);
                }
            } else {
                const data = [{
                    id: Snowflake.generate(),
                    method: req.method.toLowerCase(),
                    regex: foundRoute.regex.source,
                    increment: 1,
                    lastRequest: Date.now(),
                    requests: [{
                        increment: 1,
                        date: Date.now(),
                    }],
                }];

                await cache.set('ratelimits:ips', ip, data);
            }

            next();
        } catch (er) {
            logger.error(`${req?.user?.id || req.clientIp} Failed the Rate Limit checks, Nexting them anyways...\n${er.stack}`);
            // We next them anyways, Change later if a bug is abused (Return like, Couldn't verify the rate limit checks, Please report this and try again later.)
            next();
        }

    };
};

/**
 * @typedef {object} RateLimitObjectItem
 * @property {number} increment The increment of the request
 * @property {number} date The date of the request
 */

/**
 * @typedef {object} RateLimitObject
 * @property {string} id The Snowflake ID,
 * @property {import('../../..').Methods} method The Method used
 * @property {string} regex The Stringed Regex of the requested path
 * @property {number} increment The Current amount of requests made
 * @property {number} lastRequest The date of the last request made
 * @property {RateLimitObjectItem[]} requests
 */

/**
 * @typedef {Object} RequestOptions
 * @property {number} [max=30] The Max amount of requests can be made
 * @property {number} [reset=3600000] The Time before there is a reset
 */

/**
 * @typedef {Object} FlagOptions
 * @property {number} flag The Flag bitfield
 * @property {boolean} bypass If the flag can bypass the rate limit
 */

/**
 * @typedef {Object} Options
 * @property {RequestOptions} requests
 * @property {FlagOptions[]} flags
 */

module.exports = ratelimit;