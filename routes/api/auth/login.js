const { compare } = require("bcrypt");
const { encrypt, decrypt } = require("../../../utils/classes/encryption");
const token = require("../../../utils/classes/token");
const badgeSchema = require("../../../utils/schemas/users/badgeSchema");
const userSchema = require("../../../utils/schemas/users/userSchema")
const { important } = require("../../../utils/classes/logger");
const user = require("../../../utils/middleware/user");
const logger = require("../../../utils/classes/logger");

module.exports = {
    path: "/login",
    method: "post",
    middleWare: [user({
        botsAllowed: false,
        loggedinAllowed: false,
        needed_flags: [],
    })],
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     */
    run: async (req, res, next) => {
        try {
            /**
             * @type {{email: String, password: String, twofa: String}} 
             */
            const { email, password, twofa } = req?.body

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

            if (!usr) {
                res.status(403).send({
                    code: 403,
                    errors: [{
                        code: "ACCOUNT_NOT_FOUND",
                        message: "There was no account found with the provided email"
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

            const badges = await badgeSchema.find({ user: usr._id });

            const signed = token.sign({
                id: decrypt(usr._id),
                username: decrypt(usr.username),
                email: decrypt(usr.email),
                bot: false,
                flags: usr.flags,
                badges: (badges?.map((bad) => bad.name) ?? [])
            }, { expiresIn: "7d" })

            if (signed.hasError) {

                logger.error(`${req.clientIp} Has Encountered an error`, signed.error)

                return res.status(500).send({
                    code: 500,
                    errors: [{
                        code: "UNHANDLED_ERROR",

                    }]
                })
            }

            res.cookie("user", signed.data, {
                signed: true,
                maxAge: 86400000 * 7
            })

            res.send("OK")

        } catch (err) {
            important.error(`${req.clientIp} Encountered an error ${err.stack}`);

            res.status(500).send({
                code: 500,
                errors: [{
                    code: "UNHANDLED_ERROR",
                    message: "There was a Unhandled error, Please report this."
                }]
            })

        }
    },
}