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

const UserBadges = require('../classes/BitFields/badges');
const UserFlags = require('../classes/BitFields/flags');
const { encrypt } = require('../classes/encryption');
const logger = require('../classes/logger');
const token = require('../classes/token');
const defaultManager = require('../defaultManager');
const userSchema = require('../schemas/users/userSchema');

/**
 * The Middleware on each and every request (well it should be on it)
 * Manages everything user related to what type of user can access (bot or normal user)
 * and what flags are needed/allowed to access the endpoint, As well as if they need to be
 * logged in or not
 * @param {Object} options
 * @param {RequesterOptions[]} options.requesters The requesters
 * @param {FlagOptions[]} options.flags The flags that are allowed or required
 * @param {LoginOptions} options.login The login options
 */
const user = (options = {
    requesters: [{
        type: 'USER',
        allowed: true, // If they are allowed to access the endpoint
    }, {
        type: 'BOT',
        allowed: true,
    }],
    flags: [], // The flags required to access the endpoint (Default: [])
    login: { // If you need to be logged in to access the endpoint
        loginRequired: false, // If true they are required to login (Default: false)
        loginAllowed: true, // If true people who are logged in are allowed to access this endpoint, If login required is true this is defaulted to true (Default: true)
        loggedOutAllowed: true, // If true people who are NOT logged in are able to access the endpoint, If login required is true this defaults to false (Default: false)
    },
}) => {
    /**
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     */
    return async (req, res, next) => {
        try {
            options = defaultManager({
                requesters: [{
                    type: 'USER',
                    allowed: true,
                }, {
                    type: 'BOT',
                    allowed: true,
                }],
                flags: [],
                login: {
                    loginRequired: options?.login?.loginRequired ? true : false,
                    loginAllowed: options?.login?.loginRequired ? true : false,
                    loggedOutAllowed: options?.login?.loginRequired ? false : true,
                },
            }, options);

            const verifiedToken = token.verify(req?.headers['authorization']);

            if (verifiedToken.error) {
                logger.error(`${req.clientIp} Has Encountered an error\n ${verifiedToken.error}`);

                res.status(500).send({
                    code: 500,
                    errors: [{
                        code: 'ERROR',
                        message: 'There was an error trying to verify your token. If this percists please contact Support.',
                    }],
                    responses: [],
                });

                return;
            }

            if (!verifiedToken.data && options?.login?.loggedOutAllowed) {
                next();

                return;
            }

            if (!verifiedToken.data && options?.login?.loginRequired) {
                res.status(401).send({
                    code: 401,
                    errors: [{
                        code: 'LOGIN_REQUIRED',
                        message: 'You are required to be logged in to access this endpoint',
                    }],
                    responses: [],
                });

                return;
            }

            const usr = await userSchema.findById(encrypt(verifiedToken?.data?.id));

            if (usr) {
                if (options.requesters && Array.isArray(options.requesters)) {
                    for (const request of options.requesters) {
                        if (!request.allowed) {
                            if (request.type.toLowerCase() == 'bot' && usr.bot) {
                                return res.status(403).send({
                                    code: 403,
                                    errors: [{
                                        code: `${request.type.toLowerCase() == 'user' ? 'USERS' : request.type.toLowerCase() == 'bot' ? 'BOTS' : 'UNKNOWN'}_NOT_ALLOWED`,
                                    }],
                                    responses: [],
                                });
                            } else if (request.type.toLowerCase() == 'user' && !usr.bot) {
                                return res.status(403).send({
                                    code: 403,
                                    errors: [{
                                        code: `${request.type.toLowerCase() == 'user' ? 'USERS' : request.type.toLowerCase() == 'bot' ? 'BOTS' : 'UNKNOWN'}_NOT_ALLOWED`,
                                    }],
                                    responses: [],
                                });
                            }
                        }
                    }
                }
            }

            if (!usr && options?.login?.loginRequired) {
                res.status(401).send({
                    code: 401,
                    errors: [{
                        code: 'ACCOUNT_NOT_FOUND',
                        message: 'There was no account attached to your ID, Try to relogin.',
                    }, {
                        code: 'LOGIN_REQUIRED',
                        message: 'You are required to be logged in to access this endpoint',
                    }],
                    responses: [],
                });

                return;
            }

            if (usr && !options?.login?.loginAllowed) {
                res.status(403).send({
                    code: 403,
                    errors: [{
                        code: 'LOGGEDIN_NOT_ALLOWED',
                        message: 'You are not allowed to be logged in while using this endpoint',
                    }],
                    responses: [],
                });

                return;
            }

            const usersFlags = new UserFlags((usr.flags || 0));

            for (const flag of options.flags) {
                if (flag.required && !usersFlags.has(flag.flag)) {
                    res.status(401).send({
                        code: 401,
                        errors: [{
                            code: 'MISSING_FLAG',
                            message: 'You do not have the required flags to access this endpoint',
                        }],
                        responses: [],
                    });

                    return;
                }

                if (!flag.allowed && usersFlags.has(flag.flag)) {
                    res.status(403).send({
                        code: 403,
                        errors: [{
                            code: 'FLAG_NOT_ALLOWED',
                            message: 'Sorry but you have a flag that is not allowed to access this endpoint.',
                        }],
                        responses: [],
                    });

                    return;
                }
            }

            req.user = {
                ...verifiedToken.data,
                badges: new UserBadges(verifiedToken.data.badges).toArray(),
                flags: new UserFlags(verifiedToken.data.flags).toArray(),
                bit_badges: verifiedToken.data.badges,
                bit_flags: verifiedToken.data.flags,
            };

            next();

        } catch (er) {
            logger.error(`${req.clientIp} has encounted an error while accessing ${req.path}\n ${er.stack}`);

            if (!res.headersSent) {
                res.status(500).send({
                    code: 500,
                    errors: [{
                        code: 'ERROR',
                        message: 'There was an Error, Please contact Support.',
                    }],
                    responses: [],
                });
            }

            return;
        }
    };
};


/**
 * @typedef {Object} RequesterOptions
 * @property {"user"|"bot"|"USER"|"BOT"} type
 * @property {Boolean} required
 * @property {Boolean} allowed
 */

/**
 * @typedef {Object} LoginOptions
 * @property {Boolean} [loginRequired=false]
 * @property {Boolean} [loginAllowed=true]
 * @property {Boolean} [loggedOutAllowed=true]
 */

/**
 * @typedef {Object} FlagOptions
 * @property {Number} flag
 * @property {Boolean} required
 * @property {Boolean} allowed
 */

module.exports = user;