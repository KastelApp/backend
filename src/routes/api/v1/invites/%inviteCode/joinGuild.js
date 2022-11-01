const { completeDecryption, encrypt, decrypt } = require('../../../../../utils/classes/encryption');
const logger = require('../../../../../utils/classes/logger');
const Route = require('../../../../../utils/classes/Route');
const { generate } = require('../../../../../utils/classes/snowflake');
const userMiddleware = require('../../../../../utils/middleware/user');
const { inviteSchema, guildMemberSchema } = require('../../../../../utils/schemas/schemas');

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

    if (inv.expires.getTime() < Date.now()) {
        await inv.delete();
        await cache.delete(`guilds:${decrypt(inv.guild)}:invites:${decrypt(inv._id)}`);

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

    if (inv.uses >= (inv.max_uses ? inv.max_uses : Infinity)) {
        res.status(403).send({
            code: 403,
            errors: [{
                code: 'MAX_INVITE_USES',
                message: 'The invite you have just tried to use it at the max uses',
            }],
            responses: [],
        });

        return;
    }

    await inv.populate('guild');

    const userAlreadyExists = await guildMemberSchema.findOne({
        user: encrypt(req.user.id),
        guild: inv.guild._id,
    });

    if (userAlreadyExists) {
        res.send({
            code: 403,
            errors: [{
                code: 'ALREADY_IN_GUILD',
                message: 'You are already in that guild',
            }],
            responses: [],
        })

        return;
    }

    const gm = new guildMemberSchema({
        _id: encrypt(generate()),
        guild: inv.guild._id,
        roles: [inv.guild._id],
        user: encrypt(req.user.id),
    });

    inv.guild.members.push(gm._id);
    await gm.save();
    await gm.populate('user');
    gm.user.guilds.push(inv.guild._id);
    await gm.user.save();
    await inv.guild.save();

    res.send({
        code: 200,
        errors: [],
        responses: [{
            code: 'GUILD_JOINED',
            message: 'You have joined the guild :)',
        }],
    });
});