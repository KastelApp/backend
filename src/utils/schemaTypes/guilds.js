/*! 
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║     
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═l╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

/**
 * @type {import('./SchemaTypes').Schema}
 */
const guilds = {
    type: Array,
    data: {
        id: {
            name: "_id",
            expected: String,
            default: null
        },
        name: {
            name: "name",
            expected: String,
            default: "Unknown Guild Name"
        },
        description: {
            name: "description",
            expected: String,
            default: null
        },
        flags: {
            name: "flags",
            expected: Number,
            default: 0
        },
        owner: {
            name: "owner",
            extended: true,
            extends: "guildMember"
        },
        co_owners: {
            name: "co_owners",
            extended: true,
            extends: "guildMembers"
        },
        channels: {
            name: "channels",
            extended: true,
            extends: "channels"
        },
        roles: {
            name: "roles",
            extended: true,
            extends: "roles"
        },
        bans: {
            name: "bans",
            extended: true,
            extends: "bans"
        },
        members: {
            name: "members",
            extended: true,
            extends: "guildMembers"
        },
        invites: {
            name: "invites",
            extended: true,
            extends: "invites"
        }
    }
}

module.exports = guilds