const logger = require("../classes/logger")
const token = require("../classes/token")

const user = (options = {
    loggedinAllowed: false, // If the user is logged in and its false it will send the status 403
    botsAllowed: false, // If bots can access the endpoint
    needed_flags: [] // The flags needed, Like Staff, ETC
}) => {
    /**
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @param {import("express").NextFunction} next
     */
    return (req, res, next) => {
        const verifiedToken = token.verify(req?.signedCookies["user"]);

        if (!verifiedToken.data && options.loggedinAllowed) return res.status(401).send({
            code: 401,
            errors: [{
                code: "LOGIN_REQUIRED",
                message: "You must login to access this endpoint"
            }]
        })

        const userData = verifiedToken?.data;

        if (!userData && !options.loggedinAllowed) return next()

        if (userData?.bot && !options.botsAllowed) return  res.status(403).send({
            code: 403,
            errors: [{
                code: "BOTS_NOT_ALLOWED",
                message: "Bots are not allowed to use this endpoint"
            }]
        })

        next()
    }
}

module.exports = user;