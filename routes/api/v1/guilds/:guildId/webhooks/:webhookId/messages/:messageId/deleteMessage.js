// Deletes a message the webhook sent /api/vx/guilds/:id/webhooks/messages/:messageId/delete
module.exports = {
    path: "/delete",
    methods: ["delete", "post"], // Allow Post and Delete, We would rather have delete though
    middleWare: [],
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     */
    run: async (req, res, next) => {},
}