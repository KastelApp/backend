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

    Guild: { // Allow easier deletion of role schemas when a guild owner deletes their guild
        type: String,
        required: true,
        ref: 'guilds',
    },

    Name: {
        type: String,
        required: true,
        default: 'Unknown Role',
    },

    AllowedNsfw: {
        type: Boolean,
        required: false,
    },

    Deleteable: {
        type: Boolean,
        required: true,
        default: true,
    },

    AllowedMentions: {
        type: Number,
        required: false,
        default: 0,
    },

    Hoisted: {
        type: Boolean,
        required: false,
    },

    Color: {
        type: String,
        required: false,
    },

    Permissions: {
        type: Number,
        required: true,
        default: 0,
    },
});

export default model('Roles', RoleSchema);

export { RoleSchema }