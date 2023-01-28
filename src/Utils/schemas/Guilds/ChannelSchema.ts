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

import { model, Schema } from 'mongoose';

const ChannelSchema = new Schema({
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
        default: 2,
    },

    nsfw: {
        type: Boolean,
        required: false,
    },

    allowed_mentions: {
        type: Number,
        required: false,
        default: 0,
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

    permissions: {
        type: Number,
        required: true,
        default: 0,
    },
});

export default model('channels', ChannelSchema);

export { ChannelSchema }