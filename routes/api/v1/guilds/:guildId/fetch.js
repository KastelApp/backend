// Fetch the guilds public data /api/vx/guilds/:id/fetch
module.exports = {
    path: "/fetch",
    method: "get",
    middleWare: [],
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     */
    run: async (req, res, next) => {
        res.send({
            name: "Imagine"
        })
    },  
}