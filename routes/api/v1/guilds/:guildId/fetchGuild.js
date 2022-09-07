const defaultManager = require("../../../../../utils/defaultManager");
const userMiddleware = require("../../../../../utils/middleware/user");
const schemaData = require("../../../../../utils/schemaData");
const {
    completeDecryption,
    encrypt
} = require("../../../../../utils/classes/encryption");
const {
    guildMemberSchema,
    guildSchema,
    userSchema
} = require("../../../../../utils/schemas/schemas");

/**
 * @typedef {Object} Query
 * @property {Boolean} [include_members=false] If the user wants to include members
 * @property {Boolean} [include_invites=false] If the user wants to include invites
 * @property {Boolean} [include_bans=false] If the user wants to include bans
 * @property {Boolean} [include_channels=false] If the user wants to include channels
 * @property {Boolean} [include_roles=false] If the user wants to include roles
 */

/**
 * @typedef {Object} ExportObject
 * @property {String} path The path the user will access the run function at
 * @property {'get'|'GET'|'delete'|'DELETE'|'head'|'HEAD'|'options'|'OPTIONS'|'post'|'POST'|'put'|'PUT'|'patch'|'PATCH'|'purge'|'PURGE'} [method] The method the user requires
 * @property {('get'|'GET'|'delete'|'DELETE'|'head'|'HEAD'|'options'|'OPTIONS'|'post'|'POST'|'put'|'PUT'|'patch'|'PATCH'|'purge'|'PURGE')[]} [methods] The method the user requires
 * @property {Function[]} middleWare The middleware functions
 * @property {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {}} run The Req, Res and Next Functions 
 */

/**
 * @type {ExportObject}
 */
module.exports = {
    path: "/fetch",
    method: "get",
    middleWare: [userMiddleware({
        login: {
            loginRequired: true,
        }
    })],
    run: async (req, res) => {
        /**
         * @type {String}
         */
        const guildId = req.params.guildId

        /**
         * @type {Query}
         */
        let query = defaultManager({
            include_members: false,
            include_invites: false,
            include_bans: false,
            include_channels: false,
            include_roles: false
        }, req.query)

        for (const key in req.query) {
            try {
                const parsed = JSON.parse(req.query[key])

                query[key] = parsed
            } catch (er) {
                query[key] = req.query[key]
            }
        }

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

        const guildsDecrypted = completeDecryption(usr.guilds);

        if (!guildsDecrypted.includes(guildId)) {
            res.status(403).send({
                code: 403,
                errors: [{
                    code: "GUILD_UNFETCHABLE",
                    message: "The guild you tried to fetch is unfetchable"
                }],
                responses: []
            })

            return;
        }

        const guild = await guildSchema.findById(encrypt(guildId));

        if (!guild) {
            res.status(404).send({
                code: 404,
                errors: [{
                    code: "UNKNOWN_GUILD",
                    message: "The guild you provided was not able to be found"
                }],
                responses: []
            })

            return;
        }

        const userInGuild = await guildMemberSchema.findOne({
            guild: guild._id,
            user: usr._id
        })

        if (!userInGuild) {
            res.status(403).send({
                code: 403,
                errors: [{
                    code: "GUILD_UNFETCHABLE",
                    message: "The guild you tried to fetch is unfetchable"
                }],
                responses: []
            })

            return;
        }

        if (query.include_members) {
            await guild.populate("members")
            for (const guildMember of guild.members) {
                await guildMember.populate("user")
                await guildMember.populate("roles")
            }
        } else guild.members = []

        if (query.include_bans) {
            await guild.populate("bans")
            for (const ban of guild.bans) {
                await ban.populate("user")
                await ban.populate("banner")
            }
        } else guild.bans = []

        if (query.include_channels) {
            await guild.populate("channels")
        } else guild.channels = []

        if (query.include_invites) {
            await guild.populate("invites");

            for (const invite of guild.invites) {
                await invite.populate("creator")
            }
        } else guild.invites = []

        if (query.include_roles) {
            await guild.populate("roles")
        } else guild.roles = []

        for (const coOwner of guild.co_owners) {
            await coOwner.populate("user")
            await coOwner.populate("roles")
        }


        await (await (await guild.populate("owner")).owner.populate("user")).populate("roles")

        const guildData = schemaData("guild", completeDecryption(guild.toJSON()))

        res.send({
            code: 204,
            errors: [],
            responses: [],
            data: guildData
        })
    }
}