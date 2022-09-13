const Route = require('../../../../utils/classes/Route');
const {
    encrypt,
    completeDecryption,
    decrypt,
    completeEncryption,
} = require('../../../../utils/classes/encryption');
const defaultManager = require('../../../../utils/defaultManager');
const userMiddleware = require('../../../../utils/middleware/user');
const schemaData = require('../../../../utils/schemaData');
const { userSchema } = require('../../../../utils/schemas/schemas');
const logger = require('../../../../utils/classes/logger');
const ratelimit = require('../../../../utils/middleware/ratelimit');
const savingRequired = ['members', 'roles', 'channels', 'invites', 'bans'];

new Route(__dirname, '/fetch', 'GET', [userMiddleware({
    login: {
        loginRequired: true,
    },
}), ratelimit({ requests: { max: 3, reset: 1000 * 60 * 1 } })], async (req, res, next, redis) => {

    /**
     * @type {Array<'members'|'roles'|'channels'|'invites'|'bans'}
     */
    const query = defaultManager([], req?.query?.include?.split(','));

    const usr = await userSchema.findById(encrypt(req.user.id));

    if (!usr) {
        res.status(500).send({
            code: 500,
            errors: [{
                code: 'ERROR',
                message: 'There was an error while trying to fetch your account. Please report this.',
            }],
            responses: [],
        });

        return;
    }

    await usr.populate('guilds');

    const readyGuilds = [];

    for (const guild of usr.guilds) {
        const id = decrypt(guild._id);

        const cache = await redis.get(`guilds:${id}`, 'data');

        if (cache) {
            try {
                const guildData = {
                    ...completeDecryption(JSON.parse(cache)),
                };

                for (const q of query) {
                    if (!savingRequired.includes(q)) continue;

                    const qq = await redis.keys(`guilds:${id}:${q}`);

                    for (const key of qq) {
                        const jsonFetched = await redis.get(key);

                        if (jsonFetched) {
                            guildData[q].push(completeDecryption(JSON.parse(jsonFetched)));
                        } else {
                            guildData[q] = [];
                        }
                    }
                }

                readyGuilds.push(guildData);
            } catch (er) {
                res.status(500).send({
                    code: 500,
                    errors: [{
                        code: 'CACHING_ERROR',
                        message: 'There was a caching error, please report this',
                    }],
                });

                logger.error(`There was an error while fetching ${id}\n${er}`);

                return;
            }

        } else {
            await guild.populate('members');
            await guild.populate('bans');
            await guild.populate('channels');
            await guild.populate('invites');
            await guild.populate('roles');
            await guild.populate('co_owners');

            for (const guildMember of guild.members) {
                await guildMember.populate('user');
                await guildMember.populate('roles');
            }

            for (const invite of guild.invites) {
                await invite.populate('creator');
                await invite.creator.populate('user');
                await invite.creator.populate('roles');
            }

            for (const coOwner of guild.co_owners) {
                await coOwner.populate('user');
                await coOwner.populate('roles');
            }

            for (const ban of guild.bans) {
                await ban.populate('user');
                await ban.populate('banner');
            }

            await (await (await guild.populate('owner')).owner.populate('user')).populate('roles');

            const guildData = schemaData('guild', completeDecryption(guild.toJSON()));
            const completelyEncrypted = completeEncryption(guildData);

            await redis.set(`guilds:${id}`, 'data', {
                ...completelyEncrypted,
                members: [],
                bans: [],
                channels: [],
                roles: [],
                member_count: guild.members.length,
            });

            for (const member of completelyEncrypted.members) {
                await redis.set(`guilds:${id}:members`, decrypt(member.user.id), member);
            }

            for (const channel of completelyEncrypted.channels) {
                await redis.set(`guilds:${id}:channels`, decrypt(channel.id), channel);
            }

            for (const invite of completelyEncrypted.invites) {
                await redis.set(`guilds:${id}:invites`, decrypt(invite.id), invite);
            }

            for (const role of completelyEncrypted.roles) {
                await redis.set(`guilds:${id}:roles`, decrypt(role.id), role);
            }

            for (const ban of completelyEncrypted.bans) {
                await redis.set(`guilds:${id}:bans`, decrypt(ban.id), ban);
            }

            guildData['member_count'] = guild.members.length;

            for (const item of savingRequired) {
                if (!query.includes(item)) guildData[item] = [];
            }

            readyGuilds.push(guildData);
        }
    }

    res.send({
        code: 200,
        errors: [],
        responses: [],
        data: readyGuilds,
    });
});