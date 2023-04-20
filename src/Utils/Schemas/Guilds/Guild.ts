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
import Constants from '../../../Constants';
import Encryption from '../../Classes/Encryption';

const GuildSchema = new Schema({
    _id: {
        type: String,
        required: true,
    },

    Name: {
        type: String,
        required: true,
        default: Encryption.encrypt('Unknown Guild'),
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

    Emojis: [{
        type: String,
        required: false,
        ref: 'Emojis',
    }],

    MaxMembers: { 
        type: Number,
        required: false,
        default: Constants.Settings.Max.MemberCount,
    },

    Features: {
        type: Number,
        required: false,
        default: 0,
    }
});

export default model('Guilds', GuildSchema);

export { GuildSchema }