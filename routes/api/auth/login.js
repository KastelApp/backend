const rateLimit = require("../../../utils/middleware/rateLimits");

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
         * @type {{username: String, email: String, password: String}} 
         */
        const { username, email, password } = req?.body

        if (!(email ? true : username ? true : false) || !password) {
            res.send({
                code: "N/A",
                errors: [email ? null : username ? null : {
                    code: "MISSING_EMAIL_OR_USERNAME",
                    message: "No username or email provided"
                }, !password ? {
                    code: "MISSING_PASSWORD",
                    message: "No Password provided"
          } : null].filter((x) => x !== null)
            })

            return;
        }

        res.send("works")
    },
}