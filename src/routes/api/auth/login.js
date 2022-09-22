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

const { compare } = require('bcrypt');
const { encrypt, decrypt } = require('../../../utils/classes/encryption');
const token = require('../../../utils/classes/token');
const userSchema = require('../../../utils/schemas/users/userSchema');
const { important } = require('../../../utils/classes/logger');
const user = require('../../../utils/middleware/user');
const logger = require('../../../utils/classes/logger');
const speakeasy = require('speakeasy');
const Route = require('../../../utils/classes/Route');

new Route(__dirname, '/login', 'POST', [user({
        login: {
            loginRequired: false,
            loginAllowed: false,
            loggedOutAllowed: true,
        },
    })],
    async (req, res) => {
        try {
            /**
             * @type {{email: String, password: String, twofa: String}}
             */
            const { email, password, twofa } = req.body;

            if (!email || !password) {
                res.status(403).send({
                    code: 403,
                    errors: [email ? null : {
                        code: 'MISSING_EMAIL',
                        message: 'No Email provided',
                }, !password ? {
                        code: 'MISSING_PASSWORD',
                        message: 'No Password provided',
          } : null].filter((x) => x !== null),
                    responses: [],
                });

                return;
            }

            const usr = await userSchema.findOne({ email: encrypt(email) });

            if (!usr) {
                res.status(404).send({
                    code: 404,
                    errors: [{
                        code: 'ACCOUNT_NOT_FOUND',
                        message: 'There was no account found with the provided email',
                    }],
                    responses: [],
                });

                return;
            }

            if (usr.locked) {
                res.status(403).send({
                    code: 403,
                    errors: [{
                        code: 'LOCKED_ACCOUNT',
                        message: 'Sorry, But the account you tried to login to is currently locked, Please contact Support.',
                    }],
                    responses: [],
                });

                return;
            }

            if (usr.banned) {
                res.status(403).send({
                    code: 403,
                    errors: [{
                        code: 'ACCOUNT_BANNED',
                        message: 'The account you are trying to login to is currently banned',
                        data: {
                            reason: usr?.ban_reason ?? 'N/A',
                        },
                    }],
                    responses: [],
                });

                return;
            }

            if (usr.two_fa) {
                if (!usr.two_fa_verified) {
                    res.status(403).send({
                        code: 403,
                        errors: [{
                            code: 'TWO_FA_NOT_VERIFIED',
                            message: 'The account you are trying to login to does not have 2fa verified',
                        }],
                        responses: [],
                    });

                    return;
                }

                if (!twofa) {
                    res.status(403).send({
                        code: 403,
                        errors: [{
                            code: 'TWO_FA_CODE_REQURIED',
                            message: 'The account you are trying to login to has 2fa enabled, Please enter a code',
                        }],
                        responses: [],
                    });

                    return;
                }

                if (!usr.twofa_secret) {
                    res.status(500).send({
                        code: 500,
                        errors: [{
                            code: 'TWO_FA_SECRET_MISSING',
                            message: '2FA\'s secret is missing, Please report this.',
                        }],
                        responses: [],
                    });

                    return;
                }

                const verified = speakeasy.totp.verify({
                    secret: decrypt(usr.twofa_secret),
                    encoding: 'base32',
                    token: twofa,
                });

                if (!verified) {
                    res.status(401).send({
                        code: 401,
                        errors: [{
                            code: 'INVALID_TWO_FA_CODE',
                            message: 'The code you provided is invalid, Please try again.',
                        }],
                        responses: [],
                    });

                    return;
                }

            }

            if (!usr.password) {
                res.send({
                    code: 200,
                    errors: [],
                    responses: [{
                        code: 'RESET_PASSWORD',
                        message: 'The account you are trying to login to has no password, This could be due to staff removing it (For a hacked account etc). Please reset the password to continue',
                    }],
                });

                return;
            }

            if (!(await compare(password, usr.password))) {
                res.status(401).send({
                    code: 401,
                    errors: [{
                        code: 'INVALID_PASSWORD',
                        message: 'The password provided is invalid',
                    }],
                    responses: [],
                });

                return;
            }

            const signed = token.sign({
                id: decrypt(usr._id),
                username: decrypt(usr.username),
                email: decrypt(usr.email),
                bot: false,
                flags: usr.flags,
                badges: usr.badges,
            }, { expiresIn: '7d' });

            if (signed.error) {

                logger.error(`${req.clientIp} Has Encountered an error\n ${signed.error}`);

                res.status(500).send({
                    code: 500,
                    errors: [{
                        code: 'ERROR',
                        message: 'There was an error when trying to sign your token. Please contact Support.',
                    }],
                    responses: [],
                });

                return;
            }

            res.send({
                code: 200,
                errors: [],
                responses: [{
                    code: 'LOGGED_IN',
                    message: 'Logged in.',
                }],
                data: {
                    token: signed.data,
                    user: {
                        id: decrypt(usr._id),
                        username: decrypt(usr.username),
                        email: decrypt(usr.email),
                    },
                },
            });

        } catch (err) {
            important.error(`${req.clientIp} Encountered an error\n ${err.stack}`);

            res.status(500).send({
                code: 500,
                errors: [{
                    code: 'ERROR',
                    message: 'There was an Error, Please contact Support.',
                }],
                responses: [],
            });

        }

    },
);