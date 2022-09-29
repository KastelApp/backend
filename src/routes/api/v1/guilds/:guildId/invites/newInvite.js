const inviteGen = require('../../../../../../utils/inviteGenerator');
const { encrypt } = require('../../../../../../utils/classes/encryption');
const Route = require('../../../../../../utils/classes/Route');
const userMiddleware = require('../../../../../../utils/middleware/user');
const { guildSchema, inviteSchema, guildMemberSchema } = require('../../../../../../utils/schemas/schemas');
const { Constants } = require('../../../../../../config');

new Route(__dirname, '/new', 'POST', [userMiddleware({
    login: {
        loginRequired: true,
    },
})], async (req, res) => {
    /**
     * @type {String}
     */
    const guildId = req.params.guildId;

    let { expires, max_uses } = req.body;

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
        user: encrypt(req.user.id),
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

    if (guild.invites.length >= Constants.SETTINGS.MAX.INVITE_COUNT) {
        res.status(403).send({
            code: 403,
            errors: [{
                code: 'MAX_INVITE_COUNT',
                message: 'The guild you just tried to make a invite in is at the max invites, Please ask an Admin to delete some',
            }],
            responses: [],
        });

        return;
    }

    const inviteCode = inviteGen();

    const inviteFound = await inviteSchema.findById(encrypt(inviteCode));

    if (inviteFound) {
        res.status(400).send({
            code: 400,
            errors: [{
                code: 'INVITE_ALREADY_EXISTS',
                message: 'Wow, This is rare. The Invite Generated is already in use, Please try again!',
            }],
            responses: [],
        });

        return;
    }

    if ((new Date(expires).getTime()) <= Date.now() || new Date(expires) == 'Invalid Date') expires = new Date(`${new Date().getFullYear()}-${((new Date().getMonth() + 3) % 12) + 1}-1`);
    if (typeof max_uses !== 'number' || isNaN(max_uses)) max_uses = null;

    const invite = new inviteSchema({
        _id: (encrypt(inviteCode)),
        deleteable: true,
        guild: guild._id,
        creator: userInGuild._id,
        expires: new Date(expires),
        max_uses,
        uses: 0,
    });

    guild.invites.push(invite._id);
    await invite.save();
    await guild.save();

    res.status(201).send({
        code: 201,
        errors: [],
        responses: [{
            code: 'INVITE_CREATED',
            message: 'A Invite has been created',
            data: {
                code: inviteCode,
                expires: invite.expires,
                max_uses: invite.max_uses,
            },
        }],
    });
});