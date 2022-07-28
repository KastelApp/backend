// Gets the Webhooks Data /api/vx/guilds/:id/webhooks/:id/fetch
module.exports = {
    path: "/fetch",
    method: "get",
    middleWare: [],
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     */
    run: async (req, res, next) => {},
}