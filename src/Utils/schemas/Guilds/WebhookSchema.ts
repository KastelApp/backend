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

const WebhookSchema = new Schema({
    _id: {
        type: String,
        required: true,
    },

    guild: { // Allow easier deletion of role schemas when a guild owner deletes their guild
        type: String,
        required: true,
        ref: 'guilds',
    },

    channel: {
        type: String,
        required: true,
        ref: 'channels',
    },

    username: {
        type: String,
        required: true,
        username: 'Ghost',
    },

    token: {
        type: String,
        required: true,
        unqiue: true,
    },

    allowed_mentions: {
        type: Number,
        required: false,
        default: 0,
    },
});

export default model('webhooks', WebhookSchema);

export { WebhookSchema }