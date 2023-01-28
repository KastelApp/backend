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

const GuildSchema = new Schema({
    _id: {
        type: String,
        required: true,
    },

    name: {
        type: String,
        required: true,
        default: 'Unknown Guild',
    },

    description: {
        type: String,
        required: false,
    },

    flags: {
        type: Number,
        required: false,
        default: 0,
    },

    owner: {
        type: String,
        required: true,
        ref: 'guildMembers',
    },

    co_owners: [{
        type: String,
        required: false,
        ref: 'guildMembers',
    }],

    channels: [{
        type: String,
        required: false,
        ref: 'channels',
    }],

    roles: [{
        type: String,
        required: false,
        ref: 'roles',
    }],

    invites: [{
        type: String,
        required: false,
        ref: 'invites',
    }],

    bans: [{
        type: String,
        required: false,
        ref: 'bans',
    }],

    members: [{
        type: String,
        required: false,
        ref: 'guildMembers',
    }],
});

export default model('guilds', GuildSchema);

export { GuildSchema }