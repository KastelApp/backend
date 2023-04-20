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

const BanSchema = new Schema({
    _id: {
        type: String,
        required: true,
    },

    Guild: { // Allow easier deletion of role schemas when a guild owner deletes their guild
        type: String,
        required: true,
        ref: 'Guilds',
    },

    User: {
        type: String,
        ref: 'Users',
        required: true,
    },

    Banner: {
        type: String,
        ref: 'Users',
        required: true,
    },

    Reason: {
        type: String,
        required: false,
    },

    BannedDate: {
        type: Number,
        required: true,
        default: Date.now(),
    },

    UnbanDate: {
        type: Number,
        required: false,
    },
});

export default model('Bans', BanSchema);

export { BanSchema }