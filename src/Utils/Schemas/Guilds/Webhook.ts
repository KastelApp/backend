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
import Encryption from '../../Classes/Encryption';

const WebhookSchema = new Schema({
    _id: {
        type: String,
        required: true,
    },

    Guild: { // Allow easier deletion of role schemas when a guild owner deletes their guild
        type: String,
        required: true,
        ref: 'Guilds',
    },

    Channel: {
        type: String,
        required: true,
        ref: 'Channels',
    },

    Username: {
        type: String,
        required: true,
        username: Encryption.encrypt('Ghost'),
    },

    Token: {
        type: String,
        required: true,
        unqiue: true,
    },

    AllowedMentions: {
        type: Number,
        required: false,
        default: 0,
    },
});

export default model('Webhooks', WebhookSchema);

export { WebhookSchema }