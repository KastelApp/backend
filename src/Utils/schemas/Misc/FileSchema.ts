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

const FileSchema = new Schema({
    _id: {
        type: String,
        required: true,
    },

    message: {
        type: String,
        required: true,
        ref: 'messages',
    },

    name: {
        type: String,
        required: true,
        default: 'Unknown',
    },

    cdn_token: {
        type: String,
        required: true,
    },

    type: {
        type: String,
        required: true,
    },

    deleted: {
        type: Boolean,
        required: false,
    },
});

export default model('files', FileSchema);

export { FileSchema }