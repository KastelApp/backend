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
const { ALLOWED_MENTIONS, CHANNEL_TYPES } = require('../../../constants');

const channelSchema = new Schema({
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
    },

    description: {
        type: String,
        required: false,
    },

    type: {
        type: Number,
        required: true,
        default: CHANNEL_TYPES.GUILD_TEXT,
    },

    nsfw: {
        type: Boolean,
        required: false,
    },

    allowed_mentions: {
        type: Number,
        required: false,
        default: ALLOWED_MENTIONS.ALL,
    },

    parent: {
        type: String,
        required: false,
        ref: 'channels',
    },

    children: [{
        type: String,
        required: false,
        ref: 'channels',
    }],

    position: {
        type: Number,
        required: true,
    },
});

module.exports = model('channels', channelSchema);