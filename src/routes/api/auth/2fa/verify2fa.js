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
const { encrypt, decrypt } = require("../../../../utils/classes/encryption");
const Route = require("../../../../utils/classes/Route");

// Note, This is NOT to always verify when a user inputs a 2FA code
// It should ONLY be used when the user wants to setup 2FA on their account for the first time.

new Route(__dirname, "/verify", "POST", [user({
    login: {
        loginRequired: true,
    }
})], async (req, res) => {
    /**
     * @type {{password: String, code: String}}
     */
    const { password, code } = req.body;

    if (!code) {
        res.status(400).send({
            code: 400,
            errors: [{
                code: "NO_TOKEN_PROVIDED",
                message: "Please provide a token to verify 2fa"
                  }],
            responses: []
        })

        return;
    }

    if (!password) {
        res.status(401).send({
            code: 401,
            errors: [{
                code: "MISSING_PASSWORD",
                message: "Please provide a password"
                 }],
            responses: []
        })

        return
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

    if (!usr.password) {
        res.send({
            code: 200,
            errors: [],
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

    if (!usr.two_fa || usr.two_fa_verified) {
        res.status(400).send({
            code: 400,
            errors: [usr.two_fa ? null : {
                code: "TWO_FA_NOT_ENABLED",
                message: "2FA is not enabled, Please enable it to verify it"
                 }, !usr.two_fa_verified ? null : {
                code: "TWO_FA_VERIFIED",
                message: "2FA is already verified."
                 }].filter((x) => x !== null),
            responses: []
        })

        return;
    }

    if (!usr.twofa_secret) {
        res.status(500).send({
            code: 500,
            errors: [{
                code: "TWO_FA_SECRET_MISSING",
                message: "2FA's secret is missing, Please report this."
                 }],
            responses: []
        })

        return;
    }

    const verified = speakeasy.totp.verify({
        secret: decrypt(usr.twofa_secret),
        encoding: "base32",
        token: code
    })

    if (!verified) {
        res.status(401).send({
            code: 401,
            errors: [{
                code: "INVALID_TWO_FA_CODE",
                message: "The code you provided is invalid, Please try again."
            }],
            responses: []
        })

        return
    }

    usr.two_fa_verified = true

    await usr.save();

    res.send({
        code: 200,
        errors: [],
        responses: [{
            code: "TWO_FA_VERIFIED",
            message: "2FA is now verified."
        }]
    })

    return
})