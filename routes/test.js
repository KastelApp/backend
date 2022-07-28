const { generateId } = require("../utils/newIdGen")

module.exports = {
    path: "/",
    method: "get",
    middleWare: [],
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     */
    run: async (req, res, next) => {
        res.send(generateId())
    },
}