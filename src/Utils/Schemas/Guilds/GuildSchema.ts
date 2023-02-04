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

    Name: {
        type: String,
        required: true,
        default: 'Unknown Guild',
    },

    Description: {
        type: String,
        required: false,
    },

    Flags: {
        type: Number,
        required: false,
        default: 0,
    },

    Owner: {
        type: String,
        required: true,
        ref: 'GuildMembers',
    },

    CoOwners: [{
        type: String,
        required: false,
        ref: 'GuildMembers',
    }],

    Channels: [{
        type: String,
        required: false,
        ref: 'Channels',
    }],

    Roles: [{
        type: String,
        required: false,
        ref: 'Roles',
    }],

    Invites: [{
        type: String,
        required: false,
        ref: 'Invites',
    }],

    Bans: [{
        type: String,
        required: false,
        ref: 'Bans',
    }],

    Members: [{
        type: String,
        required: false,
        ref: 'GuildMembers',
    }],
});

export default model('Guilds', GuildSchema);

export { GuildSchema }