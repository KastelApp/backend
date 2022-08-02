const { default: mongoose } = require("mongoose")
const { generateId } = require("../../../utils/idGen")
const lengthChecker = require("../../../utils/lengthChecker")
const guildSchema = require("../../../utils/schemas/guilds/guildSchema")
const inviteSchema = require("../../../utils/schemas/guilds/inviteSchema")
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

        if (!username || !email || !password || !date_of_birth || (new Date(date_of_birth) == "Invalid Date")) {
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
         } : null, !date_of_birth ? {
                    code: "INVALID_DATE_OF_BIRTH",
                    message: "The provided Date of Birth is Invalid"
         } : new Date(date_of_birth) == "Invalid Date" ? {
                    code: "INVALID_DATE_OF_BIRTH",
                    message: "The provided Date of Birth is Invalid"
         } : null].filter((x) => x !== null)
            })

            return;
        }

        const Id = generateId();

        const tag = Id.slice((Id.length - 4)) == "0000" ? "0001" : Id.slice((Id.length - 4))

        const checks = {
            age: lengthChecker({ length: 13, type: "more" })((new Date()?.getFullYear() - new Date(date_of_birth)?.getFullYear())),
            email: await userSchema.findOne({ email }),
            usernameTag: await userSchema.findOne({ username, tag }),
            usernameslength: lengthChecker({ length: 9999, type: "more" })(await userSchema.countDocuments({ username })),
            invite: invite ? await inviteSchema.findById(invite) : null
        }

        if (!checks.age) {
            res.status(403).send({
                code: 403,
                errors: [{
                    code: "TOO_YOUNG",
                    message: "The age provided is under 13. Kastel is a 13+ only application."
                }]
            })

            return;
        }

        if (checks.email) {
            res.status(401).send({
                code: 401,
                errors: [{
                    code: "EMAIL_IN_USE",
                    message: "The email that was provided is already in use."
                }]
            })

            return;
        }

        if (checks.usernameslength) {
            res.status(500).send({
                code: 500,
                errors: [{
                    code: "MAX_USERNAMES",
                    message: `Max amount of ${username} usernames`
                }]
            })

            return;
        }

        if (checks.usernameTag) {
            // No Logic yet
            res.send({})
            return;
        }

        res.send({
            checks,
            Id,
            tag,
        })

    },
}