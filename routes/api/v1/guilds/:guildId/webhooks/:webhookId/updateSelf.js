// Updates the Webhooks Data, Username, Avatar ETC /api/vx/guilds/:id/webhooks/:id/update
module.exports = {
    path: "/update",
    method: "patch",
    middleWare: [],
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     */
    run: async (req, res, next) => {},
}