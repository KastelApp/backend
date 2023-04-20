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

const InviteSchema = new Schema({
    _id: { // The Code
        type: String,
        required: true,
    },

    Guild: {
        type: String,
        required: true,
        ref: 'Guilds',
        index: true,
    },

    Channel: {
        type: String,
        required: true,
        ref: 'Channels',
        index: true,
    },

    Expires: {
        type: Date,
        required: false,
    },

    Uses: {
        type: Number,
        required: false,
    },

    MaxUses: {
        type: Number,
        required: false,
    },

    Creator: {
        type: String,
        ref: 'GuildMembers',
        required: true,
    },

    Deleteable: { // Used for vanity URLs, Makes them undeleteable (Useful for guilds with more then one)
        type: Boolean,
        default: true,
    },
});

export default model('Invites', InviteSchema);

export { InviteSchema }