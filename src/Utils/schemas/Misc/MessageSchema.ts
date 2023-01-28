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

    author: {
        type: String,
        required: true,
        ref: 'users',
    },

    content: {
        type: String,
        required: true,
    },

    allowed_mentions: {
        type: Number,
        required: false,
        default: 0,
    },

    created_date: {
        type: Date,
        required: true,
        default: Date.now(),
    },

    updated_date: {
        type: Date,
        required: true,
        default: Date.now(),
    },

    channel: {
        type: String,
        required: true,
        ref: 'channels',
    },

});

export default model('messages', MessageSchema);

export { MessageSchema }