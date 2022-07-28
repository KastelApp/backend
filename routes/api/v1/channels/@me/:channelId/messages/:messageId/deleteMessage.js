module.exports = {
    path: "/delete",
    methods: ["delete", "post"],
    middleWare: [],
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     * @param {import("express").Application} app
     */
    run: async (req, res, next, app) => {},
}