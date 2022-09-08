const Route = require('../../../../../utils/classes/Route');
const userMiddleware = require('../../../../../utils/middleware/user');

// TODO: Finish the Delete route
// NOTES: If the user has 2FA then require a 2FA code

new Route(__dirname, '/delete', 'DELETE', [userMiddleware({
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
});