module.exports = {
    path: "/messages",
    method: "get",
    middleWare: [],
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     * @param {import("express").Application} app
     */
    run: async (req, res, next, app) => {
        const channelId = req?.params?.channelId;
        const startingId = req?.query?.startingId;
        let limit = req?.query?.limit || 100;
    },
}