const { completeDecryption, encrypt } = require('../../../../../utils/classes/encryption');
const logger = require('../../../../../utils/classes/logger');
const Route = require('../../../../../utils/classes/Route');
const userMiddleware = require('../../../../../utils/middleware/user');
const { inviteSchema } = require('../../../../../utils/schemas/schemas');

new Route(__dirname, '/join', 'PUT', [userMiddleware({
    login: {
        loginRequired: true,
    },
})], async (req, res, next, cache) => {
    /**
     * @type {String}
     */
    const inviteCode = req.params.inviteCode;
    const inv = await inviteSchema.findById(encrypt(inviteCode));

    if (!inv) {
        res.status(404).send({
            code: 400,
            errors: [{
                code: 'UNKNOWN_INVITE',
                message: 'Unable to find the invite you provided.',
             }],
            responses: [],
        });

        return;
    }

    console.log(inv);
});