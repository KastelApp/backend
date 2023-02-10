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
        ref: 'Users',
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
        type: Date,
        required: true,
        default: Date.now(),
    },

    UpdatedDate: {
        type: Date,
        required: true,
        default: Date.now(),
    },

    Channel: {
        type: String,
        required: true,
        ref: 'Channels',
    },

});

export default model('Messages', MessageSchema);

export { MessageSchema }