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

    Guild: { // Allow easier deletion of role schemas when a guild owner deletes their guild
        type: String,
        required: false,
        ref: 'Guilds',
    },

    Name: {
        type: String,
        required: true,
    },

    Description: {
        type: String,
        required: false,
    },

    Type: {
        type: Number,
        required: true,
        default: 2,
    },

    Nsfw: {
        type: Boolean,
        required: false,
    },

    AllowedMentions: {
        type: Number,
        required: false,
        default: 0,
    },

    Parent: {
        type: String,
        required: false,
        ref: 'Channels',
    },

    Children: [{
        type: String,
        required: false,
        ref: 'Channels',
    }],

    Position: {
        type: Number,
        required: true,
    },

    PermissionsOverides: [{
        type: String,
        required: false,
        ref: 'PermissionsOverides',
    }],
});

export default model('Channels', ChannelSchema);

export { ChannelSchema }