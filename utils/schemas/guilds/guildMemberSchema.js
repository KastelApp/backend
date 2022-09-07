/*! 
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║     
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

const { model, Schema } = require("mongoose");

const guildMemberSchema = new Schema({
    _id: {
        type: String,
        required: true
    },

    guild: { // Allow easier deletion of guild member schemas when a guild owner deletes their guild
        type: String,
        required: true,
        ref: "guilds"
    },

    user: {
        type: String,
        required: true,
        ref: "users"
    },

    roles: [{
        type: String,
        required: false,
        ref: "roles"
    }],

    nickname: {
        type: String,
        required: false
    }
})

module.exports = model('guildMembers', guildMemberSchema);