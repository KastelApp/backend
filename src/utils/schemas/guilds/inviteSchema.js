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

const { model, Schema } = require('mongoose');

const inviteSchema = new Schema({
    _id: { // The Code
        type: String,
        required: true,
    },

    guild: {
        type: String,
        required: true,
        ref: 'guilds',
    },

    expires: {
        type: Date,
        required: false,
    },

    uses: {
        type: Number,
        required: false,
    },

    max_uses: {
        type: Number,
        required: false,
    },

    creator: {
        type: String,
        ref: 'guildMembers',
    },

    deleteable: { // Used for vanity URLs, Makes them undeleteable (Useful for guilds with more then one)
        type: Boolean,
        default: true,
    },
});

module.exports = model('invites', inviteSchema);