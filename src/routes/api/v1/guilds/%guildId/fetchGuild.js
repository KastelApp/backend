/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

const Route = require('../../../../../utils/classes/Route');
const defaultManager = require('../../../../../utils/defaultManager');
const userMiddleware = require('../../../../../utils/middleware/user');
const schemaData = require('../../../../../utils/schemaData');
const {
    completeDecryption,
    encrypt,
    completeEncryption,
    decrypt,
} = require('../../../../../utils/classes/encryption');
const {
    guildMemberSchema,
    guildSchema,
    userSchema,
} = require('../../../../../utils/schemas/schemas');
const logger = require('../../../../../utils/classes/logger');
const savingRequired = ['members', 'roles', 'channels', 'invites', 'bans'];

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
     * @type {Array<'members'|'roles'|'channels'|'invites'|'bans'}
     */
    const query = defaultManager([], req.query?.include?.split(','));

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

    const guildsDecrypted = completeDecryption(usr.guilds);

    if (!guildsDecrypted.includes(guildId)) {
        res.status(404).send({
            code: 404,
            errors: [{
                code: 'UNKNOWN_GUILD',
                message: 'The guild you requested was not able to be found.',
            }],
            responses: [],
        });

        return;
    }

    let guildData = {};
    const cache = await redis.get(`guilds:${guildId}`, 'data');

    if (cache) {

        const member = await redis.get(`guilds:${guildId}:members`, req.user.id);

        if (!member) {
            res.status(404).send({
                code: 404,
                errors: [{
                    code: 'UNKNOWN_GUILD',
                    message: 'The guild you requested was not able to be found.',
                }],
                responses: [],
            });

            return;
        }


        try {
            guildData = {
                ...completeDecryption(JSON.parse(cache)),
            };

            for (const q of query) {
                if (!savingRequired.includes(q)) continue;

                const qq = await redis.keys(`guilds:${guildId}:${q}`);

                for (const key of qq) {
                    const jsonFetched = await redis.get(key);

                    if (jsonFetched) {
                        guildData[q].push(completeDecryption(JSON.parse(jsonFetched)));
                    } else {
                        guildData[q] = [];
                    }
                }
            }

        } catch (er) {
            res.status(403).send({
                code: 403,
                errors: [{
                    code: 'GUILD_UNFETCHABLE',
                    message: 'The guild you tried to fetch is unfetchable',
                }],
                responses: [],
            });

            logger.error(`There was an Error while Fetching ${guildId}\n${er}`);

            return;
        }

    } else {
        const guild = await guildSchema.findById(encrypt(guildId));

        if (!guild) {
            res.status(404).send({
                code: 404,
                errors: [{
                    code: 'UNKNOWN_GUILD',
                    message: 'The guild you requested was not able to be found.',
                }],
                responses: [],
            });

            return;
        }

        const userInGuild = await guildMemberSchema.findOne({
            guild: guild._id,
            user: usr._id,
        });

        if (!userInGuild) {
            res.status(404).send({
                code: 404,
                errors: [{
                    code: 'UNKNOWN_GUILD',
                    message: 'The guild you requested was not able to be found.',
                }],
                responses: [],
            });

            return;
        }

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

        guildData = schemaData('guild', completeDecryption(guild.toJSON()));
        const completelyEncrypted = completeEncryption(guildData);

        await redis.set(`guilds:${guildId}`, 'data', {
            ...completelyEncrypted,
            members: [],
            bans: [],
            channels: [],
            roles: [],
            invites: [],
            member_count: guild.members.length,
        });

        for (const member of completelyEncrypted.members) {
            await redis.set(`guilds:${guildId}:members`, decrypt(member.user.id), member);
        }

        for (const channel of completelyEncrypted.channels) {
            await redis.set(`guilds:${guildId}:channels`, decrypt(channel.id), channel);
        }

        for (const role of completelyEncrypted.roles) {
            await redis.set(`guilds:${guildId}:roles`, decrypt(role.id), role);
        }

        for (const invite of completelyEncrypted.invites) {
            await redis.set(`guilds:${guildId}:invites`, decrypt(invite.id), invite);
        }

        for (const ban of completelyEncrypted.bans) {
            await redis.set(`guilds:${guildId}:bans`, decrypt(ban.id), ban);
        }

        for (const item of savingRequired) {
            if (!query.includes(item)) guildData[item] = [];
        }
    }

    res.send({
        code: 204,
        errors: [],
        responses: [],
        data: guildData,
    });
});