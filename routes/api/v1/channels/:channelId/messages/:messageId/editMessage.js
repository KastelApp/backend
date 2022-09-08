const Route = require("../../../../../../../utils/classes/Route")
const userMiddleware = require("../../../../../../../utils/middleware/user")

new Route(__dirname, "/", "patch", [userMiddleware({
    login: {
        loginRequired: true,
    }
})], async (req, res) => {
    /**
     * @type {{channelId: String, messageId: String}}
     */
    const { channelId, messageId } = req.params
})