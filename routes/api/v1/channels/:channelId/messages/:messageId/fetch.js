const userMiddleware = require("../../../../../../../utils/middleware/user")

module.exports = {
    path: "/fetch",
    method: "get",
    middleWare: [userMiddleware({
        login: {
            loginRequired: true,
        }
    })],

    run: async (req, res) => {
        /**
         * @type {{channelId: String, messageId: String}}
         */
        const { channelId, messageId } = req.params
    }
}