const userMiddleware = require("../../../../../../../utils/middleware/user")

module.exports = {
    path: "/",
    method: "patch",
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