const Route = require('../../../../utils/classes/Route');
const {
    encrypt,
    completeDecryption,
} = require('../../../../utils/classes/encryption');
const defaultManager = require('../../../../utils/defaultManager');
const userMiddleware = require('../../../../utils/middleware/user');
const schemaData = require('../../../../utils/schemaData');
const { userSchema } = require('../../../../utils/schemas/schemas');


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
     * @type {Query}
     */
    const query = defaultManager([], req?.query?.include?.split(','));

    console.log(query);

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

        if (guild.co_owners.length !== 0) {
            await guild.populate('co_owners');
            for (const coOwner of guild.co_owners) {
                await coOwner.populate('user');
                await coOwner.populate('roles');
            }
        }

        await (await (await guild.populate('owner')).owner.populate('user')).populate('roles');

        readyGuilds.push(guild.toJSON());
    }

    const guildData = schemaData('guilds', completeDecryption(readyGuilds));

    res.send({
        code: 200,
        errors: [],
        responses: [],
        data: guildData,
    });
});