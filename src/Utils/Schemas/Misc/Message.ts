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

const MessageSchema = new Schema({
    _id: {
        type: String,
        required: true,
    },

    Author: {
        type: String,
        required: true,
        ref: 'GuildMembers',
    },

    Content: {
        type: String,
        required: true,
    },

    AllowedMentions: {
        type: Number,
        required: false,
        default: 0,
    },

    CreatedDate: {
        type: Number,
        required: true,
        default: Date.now(),
        index: true,
    },

    UpdatedDate: {
        type: Number,
        required: false,
        default: null,
    },

    Channel: {
        type: String,
        required: true,
        ref: 'Channels',
        index: true,
    },

    Nonce: {
        type: String,
        required: false,
        index: true,
    },

    Flags: {
        type: Number,
        required: false,
        default: 0,
    },

    Embeds: {
        type: Array,
        required: false,
        default: [],
    },

    Attachments: {
        type: Array,
        required: false,
        ref: "Files",
        default: [],
    },

    ReplyingTo: {
        type: String,
        required: false,
        ref: 'Messages',
    },
});

export default model('Messages', MessageSchema);

export { MessageSchema }