const Route = require("../../../../utils/classes/Route")
const { generate } = require("../../../../utils/classes/snowflake");
const {
    FLAGS,
    SETTINGS,
    ALLOWED_MENTIONS,
    CHANNEL_TYPES
} = require("../../../../constants");
const {
    encrypt,
    decrypt,
} = require("../../../../utils/classes/encryption");
const {
    userSchema,
    channelSchema,
    guildMemberSchema,
    guildSchema,
    roleSchema,
} = require("../../../../utils/schemas/schemas");
const userMiddleware = require("../../../../utils/middleware/user");

new Route(__dirname, "/new", "POST", [userMiddleware({
    login: {
        loginRequired: true,
    },
    requesters: [{
        type: "BOT",
        allowed: false
    }, {
        type: "USER",
        allowed: true
    }],
    flags: [{
        flag: FLAGS.GUILD_BAN,
        allowed: false,
        required: false
    }]
})], async (req, res) => {
    /**
     * @type {{name: String, description: String, icon: String}}
     */
    const { name, description } = req.body;

    const usr = await userSchema.findById(encrypt(req.user.id));

    if (!usr) {
        res.status(500).send({
            code: 500,
            errors: [{
                code: "ERROR",
                message: "There was an error while trying to fetch your account. Please report this."
            }],
            responses: []
        })

        return;
    }

    if (usr.guilds.length >= SETTINGS.MAX_GUILD_COUNT) {
        res.send({
            code: 403,
            errors: [{
                code: "MAX_GUILD_COUNT",
                message: "You are at the max guilds you can have"
            }],
            responses: []
        })

        return;
    }

    const guildData = {
        _id: encrypt(generate()),
        name: (name ? encrypt(name) : encrypt(`${decrypt(usr.username)}'s Guild`)),
        description: (description ? encrypt(description) : null),
        owner: null,
        channels: [],
        roles: [],
        invites: [],
        bans: [],
        members: []
    }

    const everyoneRole = new roleSchema({
        _id: guildData._id,
        guild: guildData._id,
        name: encrypt("everyone"),
        allowed_nsfw: false,
        deleteable: false,
        allowed_mentions: ALLOWED_MENTIONS.ALL,
        hoisted: false,
        color: null
    })

    const startingCat = new channelSchema({
        _id: encrypt(generate()),
        guild: guildData._id,
        name: "General",
        type: CHANNEL_TYPES.GUILD_CATEGORY,
        position: 0,
        children: []
    })

    const startingChannel = new channelSchema({
        _id: encrypt(generate()),
        guild: guildData._id,
        name: encrypt("chat"),
        description: encrypt(`Hey! Why not chat about weather?`),
        type: CHANNEL_TYPES.GUILD_TEXT,
        nsfw: false,
        allowed_mentions: ALLOWED_MENTIONS.ALL,
        parent: startingCat._id,
        position: 0
    })

    const guildMember = new guildMemberSchema({
        _id: encrypt(generate()),
        guild: guildData._id,
        user: usr._id,
        roles: [everyoneRole._id]
    })

    startingCat.children.push(startingChannel._id)
    guildData.roles.push(everyoneRole._id);
    guildData.channels.push(startingCat._id)
    guildData.channels.push(startingChannel._id)
    guildData.members.push(guildMember._id)
    guildData.owner = guildMember._id
    usr.guilds.push(guildData._id)

    const guild = new guildSchema({
        ...guildData
    })

    await guild.save();
    await everyoneRole.save();
    await guildMember.save();
    await startingCat.save();
    await startingChannel.save();
    await usr.save();

    res.status(201).send({
        code: 201,
        errors: [],
        responses: [{
            code: "GUILD_CREATED",
            message: "The guild has been created."
        }]
    })

    return;
})