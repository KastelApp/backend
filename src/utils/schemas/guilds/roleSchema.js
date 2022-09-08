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
const { ALLOWED_MENTIONS } = require('../../../constants');

const roleSchema = new Schema({
    _id: {
        type: String,
        required: true,
    },

    guild: { // Allow easier deletion of role schemas when a guild owner deletes their guild
        type: String,
        required: true,
        ref: 'guilds',
    },

    name: {
        type: String,
        required: true,
        default: 'Unknown Role',
    },

    allowed_nsfw: {
        type: Boolean,
        required: false,
    },

    deleteable: {
        type: Boolean,
        required: true,
        default: true,
    },

    allowed_mentions: {
        type: Number,
        required: false,
        default: ALLOWED_MENTIONS.ALL,
    },

    hoisted: {
        type: Boolean,
        required: false,
    },

    color: {
        type: String,
        required: false,
    },
});

module.exports = model('roles', roleSchema);