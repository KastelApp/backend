const Route = require('../../../../../../utils/classes/Route');
const userMiddleware = require('../../../../../../utils/middleware/user');

new Route(__dirname, '/fetch', 'GET', [userMiddleware({
    login: {
        loginRequired: true,
    },
})], async (req, res) => {
    /**
     * @type {String}
     */
    const channelId = req.params.channelId;
});