// Deletes the webhook /api/vx/guilds/:id/webhooks/:id/delete
module.exports = {
    path: "/delete",
    methods: ["delete", "post"],
    middleWare: [],
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     */
    run: async (req, res, next) => {},
}