const { default: mongoose } = require("mongoose")
module.exports = {
    path: "/",
    method: "all",
    middleWare: [],
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     */
    run: async (req, res, next) => {
        const e = mongoose.connection.host

        res.send(e)
    },
}