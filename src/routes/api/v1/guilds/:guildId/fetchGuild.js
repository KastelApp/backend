const Route = require('../../../../../utils/classes/Route');
const defaultManager = require('../../../../../utils/defaultManager');
const userMiddleware = require('../../../../../utils/middleware/user');
const schemaData = require('../../../../../utils/schemaData');
const {
    completeDecryption,
    encrypt,
} = require('../../../../../utils/classes/encryption');
const {
    guildMemberSchema,
    guildSchema,
    userSchema,
} = require('../../../../../utils/schemas/schemas');

/**
 * @typedef {Object} Query
 * @property {Array<'members'|'roles'|'channels'|'invites'|'bans'} [include] What the user wants to include
 */

new Route(__dirname, '/fetch', 'GET', [userMiddleware({
    login: {
        loginRequired: true,
    },
})], async (req, res) => {
    /**
     * @type {String}
     */
    const guildId = req.params.guildId;

    /**
     * @type {Query}
     */
    const query = defaultManager([], req.query?.include.split(','));

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
        res.status(403).send({
            code: 403,
            errors: [{
                code: 'GUILD_UNFETCHABLE',
                message: 'The guild you tried to fetch is unfetchable',
            }],
            responses: [],
        });

        return;
    }

    const guild = await guildSchema.findById(encrypt(guildId));

    if (!guild) {
        res.status(404).send({
            code: 404,
            errors: [{
                code: 'UNKNOWN_GUILD',
                message: 'The guild you provided was not able to be found',
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
        res.status(403).send({
            code: 403,
            errors: [{
                code: 'GUILD_UNFETCHABLE',
                message: 'The guild you tried to fetch is unfetchable',
            }],
            responses: [],
        });

        return;
    }

    if (query.include.includes('members')) {
        await guild.populate('members');
        for (const guildMember of guild.members) {
            await guildMember.populate('user');
            await guildMember.populate('roles');
        }
    } else { guild.members = []; }

    if (query.include.includes('bans')) {
        await guild.populate('bans');
        for (const ban of guild.bans) {
            await ban.populate('user');
            await ban.populate('banner');
        }
    } else { guild.bans = []; }

    if (query.include.includes('channels')) {
        await guild.populate('channels');
    } else { guild.channels = []; }

    if (query.include.includes('invites')) {
        await guild.populate('invites');

        for (const invite of guild.invites) {
            await invite.populate('creator');
        }
    } else { guild.invites = []; }

    if (query.include.includes('roles')) {
        await guild.populate('roles');
    } else { guild.roles = []; }

    for (const coOwner of guild.co_owners) {
        await coOwner.populate('user');
        await coOwner.populate('roles');
    }

    await (await (await guild.populate('owner')).owner.populate('user')).populate('roles');

    const guildData = schemaData('guild', completeDecryption(guild.toJSON()));

    res.send({
        code: 204,
        errors: [],
        responses: [],
        data: guildData,
    });
});