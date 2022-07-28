// Posts a new Message /api/vx/guilds/:id/webhooks/:id/messages
module.exports = {
    path: "/",
    method: "post",
    middleWare: [],
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     */
    run: async (req, res, next) => {},
}