const Route = require('../../../../../utils/classes/Route');
const userMiddleware = require('../../../../../utils/middleware/user');

new Route(__dirname, '/fetch', 'GET', [userMiddleware({
    login: {
        loginRequired: false,
        loggedOutAllowed: true,
    },
})], async (req, res) => {
    /**
     * @type {String}
     */
    const inviteCode = req.params.inviteCode;

});