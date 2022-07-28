// Gets all the guilds webhooks /api/vx/guilds/:id/webhooks/
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
        res.send([{
            name: "lol"
        }])
    },  
}