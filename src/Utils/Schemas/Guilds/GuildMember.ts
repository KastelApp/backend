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

const GuildMemberSchema = new Schema({
    _id: {
        type: String,
        required: true,
    },

    Guild: { // Allow easier deletion of guild member schemas when a guild owner deletes their guild
        type: String,
        required: true,
        ref: 'Guilds',
    },

    User: {
        type: String,
        required: true,
        ref: 'Users',
    },

    Roles: [{
        type: String,
        required: false,
        ref: 'Roles',
    }],

    Nickname: {
        type: String,
        required: false,
    },

    JoinedAt: {
        type: Number,
        required: true,
        default: Date.now(),
    },

    Flags: { // 1 << 0 = Left The Guild, 1 << 1 = In The Guild, 1 << 2 = Kicked From The Guild, 1 << 3 = Banned From The Guild, 1 << 4 = Owner Of The Guild
        type: Number,
        required: false,
        default: 0,
    },
});

export default model('GuildMembers', GuildMemberSchema);

export { GuildMemberSchema }