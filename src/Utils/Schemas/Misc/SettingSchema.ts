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

const SettingSchema = new Schema({
    User: {
        type: String,
        ref: 'Users',
        required: true,
    },

    Status: {
        type: String,
        required: false,
    },

    Presence: {
        type: Number,
        required: true,
        default: 0,
    },

    Tokens: {
        type: Array,
        required: true,
        default: [],
    }
});

export default model('Settings', SettingSchema);

export { SettingSchema }