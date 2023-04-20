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

const VerifcationLinkSchema = new Schema({
    _id: {
        type: String,
        required: true,
    },

    Code: {
        type: String,
        required: true,
        index: true,
    },

    User: {
        type: String,
        required: true,
        ref: 'Users',
    },

    CreatedDate: {
        type: Number,
        required: true,
        default: Date.now(),
    },

    ExpireDate: {
        type: Number,
        required: true,
        default: Date.now() + 1000 * 60 * 60 * 24,
    },

    Ip: {
        type: String,
        required: true,
        index: true,
    },

    Flags: {
        type: Number,
        required: true,
        default: 0,
        index: true,
    }
});

export default model('VerifcationLink', VerifcationLinkSchema);

export { VerifcationLinkSchema }