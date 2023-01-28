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

const FriendSchema = new Schema({
    sender: {
        type: String,
        required: true,
        ref: 'users',
    },

    receiver: {
        type: String,
        required: true,
        ref: 'users',
    },

    senderNickname: {
        type: String,
        required: false,
    },

    receiverNickname: {
        type: String,
        required: false,
    },

    accepted: {
        type: Boolean,
        required: false,
    },
});

export default model('friends', FriendSchema);

export { FriendSchema }