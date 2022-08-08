module.exports = {
    path: "/",
    method: "patch",
    middleWare: [],
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     */
    run: async (req, res, next) => {

        /**
         * @type {{email: String, username: String, tag: String, password: String, ip_verify: Boolean, ip_lock: Boolean, ips: Array<String>}}
         */
        const {email, username, tag, password, ip_verify, ip_lock, ips} = req?.body

    },
}