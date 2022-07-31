const { default: mongoose } = require("mongoose")
const { generateId } = require("../../../utils/idGen")
const lengthChecker = require("../../../utils/lengthChecker")
const guildSchema = require("../../../utils/schemas/guilds/guildSchema")
const userSchema = require("../../../utils/schemas/users/userSchema")

// This is a testing endpoint as of now. Code here can and will be completely changed.
module.exports = {
    path: "/register",
    method: "post",
    middleWare: [],
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     */
    run: async (req, res, next) => {
        /**
         * @type {{username: String, email: String, password: String, date_of_birth: Date, invite: String}} 
         */
        const { username, email, password, date_of_birth, invite } = req?.body

        if (!username || !email || !password) {
            res.status(400).send({
                code: 400,
                errors: [!username ? {
                    code: "MISSING_USERNAME",
                    message: "No username provided"
         } : null, !email ? {
                    code: "MISSING_EMAIL",
                    message: "No email provided."
         } : null, !password ? {
                    code: "MISSING_PASSWORD",
                    message: "No Password provided"
         } : null].filter((x) => x !== null)
            })

            return;
        }

        const Id = generateId();

        const tag = Id.split("").reverse().join("").slice(0, 4).split("").reverse().join("")

        const checks = {
            email: await userSchema.findOne({ email }),
            usernameTag: await userSchema.findOne({ username, tag }),
            usernameslength: await userSchema.countDocuments({ username })
        }

        if (lengthChecker({ length: 9999, type: "less" })(checks.usernameslength)) {
            res.status(500).send({
                code: 500,
                errors: [{
                    code: "MAX_USERNAMES",
                    message: `Max amount of ${username}`
                }]
            })

            return;
        }

        if (checks.usernameTag) {
            // No Logic yet

            return;
        }

    },
}