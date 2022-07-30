const { default: mongoose } = require("mongoose")
const guildSchema = require("../../../utils/schemas/guildSchema")
const userSchema = require("../../../utils/schemas/userSchema")

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
            res.send({
                code: "N/A",
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




    },
}