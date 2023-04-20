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

const EmojiSchema = new Schema({
    _id: {
        type: String,
        required: true,
    },

    Guild: {
        type: String,
        required: true,
        ref: 'Guilds',
    },

    Creator: {
        type: String,
        ref: 'GuildMembers',
    },

    Name: {
        type: String,
        required: true,
    },

    EmojiHash: { // The hash of the emoji
        type: String,
        required: true,
    },

    Disabled: { // If the emoji is disabled it can't be used (for example if the user deletes the emoji)
        type: Boolean,
        required: true,
        default: false,
    },

    Public: { // If the emoji is public it can be used anywhere on Kastel, if its false its guild only
        type: Boolean,
        required: true,
        default: true,
    },
});

export default model('Emojis', EmojiSchema);

export { EmojiSchema }