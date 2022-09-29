const Route = require('../../../../../utils/classes/Route');
const userMiddleware = require('../../../../../utils/middleware/user');

new Route(__dirname, '/', 'patch', [userMiddleware({
    login: {
        loginRequired: true,
    },
})], async (req, res) => {
    /**
     * @type {String}
     */
    const guildId = req.params.guildId;

    return res.send('This is a WIP');
});