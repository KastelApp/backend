const { completeDecryption, encrypt, completeEncryption } = require('../../../../../utils/classes/encryption');
const logger = require('../../../../../utils/classes/logger');
const Route = require('../../../../../utils/classes/Route');
const userMiddleware = require('../../../../../utils/middleware/user');
const schemaData = require('../../../../../utils/schemaData');
const { inviteSchema } = require('../../../../../utils/schemas/schemas');

new Route(__dirname, '/fetch', 'GET', [userMiddleware({
    login: {
        loginRequired: true,
    },
})], async (req, res, next, cache) => {
    /**
     * @type {String}
     */
    const inviteCode = req.params.inviteCode;

    const cachedInvData = await cache.kget(`guilds:*:invites:${inviteCode}`);

    if (Object.keys(cachedInvData).length >= 1) {
        for (const key in cachedInvData) {
            const guildId = cachedInvData[key][1];

            const guild = await cache.get(`guilds:${guildId}`, 'data');

            if (guild) {
                try {
                    const guildData = completeDecryption(JSON.parse(guild));

                    res.send({
                        code: 204,
                        errors: [],
                        responses: [],
                        data: {
                            id: guildData.id,
                            name: guildData.name,
                            flags: guildData.flags,
                            owner: guildData.owner.user,
                            member_count: guildData.member_count,
                        },
                    });

                    return;
                } catch (er) {
                    res.status(500).send({
                        code: 500,
                        errors: [{
                            code: 'CACHING_ERROR',
                            message: 'There was a caching error, please report this',
                        }],
                    });

                    logger.error(`There was an error while fetching ${inviteCode}\n${er}`);

                    return;
                }
            }

        }
    }

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
    } else {
        await inv.populate('guild');
        await (await (await inv.guild.populate('owner')).owner.populate('user')).populate('roles');
        await inv.populate('creator');
        await inv.creator.populate('roles');
        await inv.creator.populate('user');
        const invDecrypted = completeDecryption(inv.toJSON());
        const invData = schemaData('invite', invDecrypted);

        await cache.set(`guilds:${invDecrypted.guild._id}:invites`, invData.id, completeEncryption(invData));

        res.send({
            code: 204,
            errors: [],
            responses: [],
            data: {
                id: invDecrypted.guild._id,
                name: invDecrypted.guild.name,
                flags: invDecrypted.guild.flags,
                owner: schemaData('friendUser', {
                    ...invDecrypted.guild.owner.user,
                }),
                member_count: invDecrypted.guild.members.length,
            },
        });
    }

});