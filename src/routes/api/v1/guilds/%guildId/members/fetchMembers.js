const Route = require('../../../../../../utils/classes/Route');
const userMiddleware = require('../../../../../../utils/middleware/user');

new Route(__dirname, '/fetch', 'get', [userMiddleware({
    login: {
        loginRequired: true,
    },
})], async (req, res) => {
    /**
     * @type {String}
     */
    const guildId = req.params.guildId;
});