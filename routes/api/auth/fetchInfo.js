/*! 
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║     
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

const { compare } = require("bcrypt");
const { encrypt } = require("../../../utils/classes/encryption");
const userSchema = require("../../../utils/schemas/users/userSchema")
const user = require("../../../utils/middleware/user");
const logger = require("../../../utils/classes/logger");

module.exports = {
    path: "/fetch",
    method: "post",
    middleWare: [user({
        login: {
            loginRequired: false,
            loginAllowed: true,
            loggedOutAllowed: true
        }
    })],

    run: async (req, res, next) => {
        try {

            /**
             * @type {{ email: String, password: String }} 
             */
            const { email, password } = req.body

            if (!email || !password) {
                res.status(403).send({
                    code: 403,
                    errors: [email ? null : {
                        code: "MISSING_EMAIL",
                        message: "No Email provided"
            }, !password ? {
                        code: "MISSING_PASSWORD",
                        message: "No Password provided"
                } : null].filter((x) => x !== null)
                })

                return;
            }

            const usr = await userSchema.findOne({ email: encrypt(email) });

            if (!(await compare(password, usr.password))) {
                res.status(401).send({
                    code: 401,
                    errors: [{
                        code: "INVALID_PASSWORD",
                        message: "The password provided is invalid"
                    }]
                })

                return;
            }

            res.send({
                code: 200,
                errors: [],
                responses: [],
                data: {
                    email_verified: usr.email_verified ?? false,
                    two_fa: usr.two_fa ?? false,
                    two_fa_verified: usr.two_fa_verified ?? false,
                    banned: usr.banned ?? false,
                    locked: usr.locked ?? false,
                    account_deletion_in_progress: usr.account_deletion_in_progress ?? false,
                    show_ads: usr.show_ads ?? false
                }
            })
        } catch (er) {
            logger.important.error(`${req.clientIp} Encountered an Error.\n ${er.stack}`)
            res.status(500).send({
                code: 500,
                errors: [{
                    code: "ERROR",
                    message: `There was an Error, Please contact Support.`
                }]
            })
        }
    }
}