const { encrypt, completeDecryption, completeEncryption } = require('../../../../../../utils/classes/encryption');
const Route = require('../../../../../../utils/classes/Route');
const defaultManager = require('../../../../../../utils/defaultManager');
const userMiddleware = require('../../../../../../utils/middleware/user');
const schemaData = require('../../../../../../utils/schemaData');
const { guildSchema } = require('../../../../../../utils/schemas/schemas');

new Route(__dirname, '/fetch', 'GET', [userMiddleware({
    login: {
        loginRequired: true,
    },
})], async (req, res, next, redis) => {
    /**
     * @type {String}
     */
    const guildId = req.params.guildId;

    /**
     * @type {Array<'creator'>}
     */
    const query = defaultManager([], req.query?.include?.split(','));

    const cache = await redis.keys(`guilds:${guildId}`, 'invites');

    let invites = [];

    if (cache.length > 0) {
        try {
            for (const key of cache) {
                const inviteFetched = await redis.get(key);
                const invite = completeDecryption(JSON.parse(inviteFetched));

                if (!query.includes('creator')) {
                    invites.push({
                        ...invite,
                        creator: null,
                    });
                } else {
                    invites.push(invite);
                }
            }
        } catch (er) {
            console.error(er);
        }

    } else {
        const enGuild = await guildSchema.findById(encrypt(guildId));

        if (!enGuild) {
            res.status(404).send({
                code: 404,
                errors: [{
                    code: 'UNKNOWN_GUILD',
                    message: 'Unable to find the guild, Did you enter the right ID?',
                }],
                responses: [],
            });

            return;
        }

        await enGuild.populate('invites');

        for (const invite of enGuild.invites) {
            await invite.populate('creator');
            await invite.creator.populate('user');
            await invite.creator.populate('roles');
        }

        invites = schemaData('invites', (completeDecryption(enGuild.toJSON().invites)));

        for (const invite of invites) {
            await redis.set(`guilds:${guildId}:invites`, invite.id, completeEncryption(invite));
        }

        if (!query.includes('creator')) {
            invites = invites.map((x) => {
                return {
                    ...x,
                    creator: null,
                };
            });
        }
    }

    res.send({
        code: 204,
        errors: [],
        responses: [],
        data: invites,
    });
});