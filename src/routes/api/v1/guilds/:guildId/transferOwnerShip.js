const Route = require('../../../../../utils/classes/Route');
const userMiddleware = require('../../../../../utils/middleware/user');

// TODO: Finish the transfer route
// Notes: If 2FA is enabled then a 2FA code is required

new Route(__dirname, '/transfer', 'PUT', [userMiddleware({
    login: {
        loginRequired: true,
    },
    requesters: [{
        type: 'BOT',
        allowed: false,
    }, {
        type: 'USER',
        allowed: true,
    }],
})], async (req, res) => {
    /**
     * @type {String}
     */
    const guildId = req.params.guildId;

    return res.send('This is a WIP');
});