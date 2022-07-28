// Edits a message the webhook sent /api/vx/guilds/:id/webhooks/messages/:messageId/edit
module.exports = {
    path: "/edit",
    method: "patch",
    middleWare: [],
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     */
    run: async (req, res, next) => {},
}