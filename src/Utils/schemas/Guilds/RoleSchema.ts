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

const RoleSchema = new Schema({
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
        default: 0,
    },

    hoisted: {
        type: Boolean,
        required: false,
    },

    color: {
        type: String,
        required: false,
    },

    permissions: {
        type: Number,
        required: true,
        default: 0,
    },
});

export default model('roles', RoleSchema);

export { RoleSchema }