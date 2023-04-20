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
import Encryption from '../../Classes/Encryption';

const RoleSchema = new Schema({
    _id: {
        type: String,
        required: true,
    },

    Guild: { // Allow easier deletion of role schemas when a guild owner deletes their guild
        type: String,
        required: true,
        ref: 'Guilds',
    },

    Name: {
        type: String,
        required: true,
        default: Encryption.encrypt('Unknown Role'),
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
        type: Number,
        required: false,
    },

    Permissions: {
        type: String,
        required: true,
        default: 0,
    },

    Position: {
        type: Number,
        required: true,
        default: 0,
    },
});

export default model('Roles', RoleSchema);

export { RoleSchema }