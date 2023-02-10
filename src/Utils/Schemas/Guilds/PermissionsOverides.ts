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

const PermissionsOverides = new Schema({
    _id: {
        type: String,
        required: true,
    },

    Allow: {
        type: String,
        required: true,
        default: "0"
    },

    Deny: {
        type: String,
        required: true,
        default: "0",
    },

    Type: { // 1 << 0 = role, 1 << 1 = member
        type: String,
        required: true,
    },

    Editable: { // If the permission is editable by a user (For setting Owner permissions)
        type: Boolean,
        required: true,
        default: true,
    },
});

export default model('PermissionsOverides', PermissionsOverides);

export { PermissionsOverides }