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
const user = require("../../../../utils/middleware/user")
const speakeasy = require('speakeasy');
const userSchema = require("../../../../utils/schemas/users/userSchema");
const { encrypt } = require("../../../../utils/classes/encryption");

module.exports = {
    path: "/new",
    method: "post",
    middleWare: [user({
        login: {
            loginRequired: true,
        }
    })],

    run: async (req, res, next) => {
        /**
         * @type {{password: String}}
         */
        const { password } = req.body;

        if (!password) {
            res.status(401).send({
                code: 401,
                errors: [{
                    code: "MISSING_PASSWORD",
                    message: "Please provide a password"
                }],
                responses: []
            })

            return;
        }

        const usr = await userSchema.findById(encrypt(req.user.id));

        if (!usr) {
            res.status(500).send({
                code: 500,
                errors: [{
                    code: "ERROR",
                    message: "There was an error while trying to fetch your account. Please report this."
                }],
                responses: []
            })

            return;
        }

        if (usr.two_fa) {
            res.status(400).send({
                code: 400,
                errors: [{
                    code: "TWO_FA_ENABLED",
                    message: "2FA is already enabled"
                }]
            })

            return;
        }

        if (!usr.password) {
            res.send({
                code: 200,
                responses: [{
                    code: "RESET_PASSWORD",
                    message: "The account you are trying to login to has no password, This could be due to staff removing it (For a hacked account etc). Please reset the password to continue"
                }]
            })

            return;
        }

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

        const twofa_secret = speakeasy.generateSecret({
            name: "Kastel"
        })

        usr.two_fa = true
        usr.twofa_secret = encrypt(twofa_secret.base32);

        await usr.save();

        res.send({
            code: 200,
            errors: [],
            responses: [{
                code: "TWO_FA_ENABLED",
                message: "2FA has been enabled, Please verify it to continue using your account.",
                data: twofa_secret.otpauth_url
            }]
        })
    },
}