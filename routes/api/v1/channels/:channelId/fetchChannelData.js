module.exports = {
    path: "/fetch",
    method: "get",
    middleWare: [],
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     * @param {import("express").Application} app
     */
    run: async (req, res, next, app) => {
        const channelId = req.params.channelId;
        const includeMessages = req?.query?.includemessages;
        const limit = req?.query?.limit;
    },
}