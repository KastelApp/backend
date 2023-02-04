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
    Sender: {
        type: String,
        required: true,
        ref: 'users',
    },

    Receiver: {
        type: String,
        required: true,
        ref: 'users',
    },

    SenderNickname: {
        type: String,
        required: false,
    },

    ReceiverNickname: {
        type: String,
        required: false,
    },

    Flags: {
        type: Number,
        required: false,
    },
});

export default model('Friends', FriendSchema);

export { FriendSchema }