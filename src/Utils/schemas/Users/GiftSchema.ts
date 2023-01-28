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

const GiftSchema = new Schema({
    _id: { // The gift token/id
        type: String,
        required: true,
    },

    user: {
        type: String,
        required: true,
        ref: 'users',
    },

    type: {
        type: Number,
        required: true,
    },

    max_age: {
        type: Date,
        required: true,
    },

    gift_length: {
        type: Date,
        required: true,
    },

    used_by: {
        type: String,
        required: true,
        ref: 'users',
    },
});

export default model('gifts', GiftSchema);

export { GiftSchema }