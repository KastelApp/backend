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

    Message: {
        type: String,
        required: true,
        ref: 'Messages',
    },

    Name: {
        type: String,
        required: true,
        default: 'Unknown',
    },

    CdnToken: {
        type: String,
        required: true,
    },

    Type: {
        type: String,
        required: true,
    },

    Deleted: {
        type: Boolean,
        required: false,
    },
});

export default model('Files', FileSchema);

export { FileSchema }