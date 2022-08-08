const { compare } = require("bcrypt");
const userSchema = require("../../../utils/schemas/users/userSchema")

module.exports = {
    path: "/login",
    method: "post",
    middleWare: [],
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     */
    run: async (req, res, next) => {
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

        const usr = await userSchema.findOne({ email });

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

        res.send(usr)
    },
}