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

    guild: { // Allow easier deletion of guild member schemas when a guild owner deletes their guild
        type: String,
        required: true,
        ref: 'guilds',
    },

    user: {
        type: String,
        required: true,
        ref: 'users',
    },

    roles: [{
        type: String,
        required: false,
        ref: 'roles',
    }],

    nickname: {
        type: String,
        required: false,
    },
});

export default model('guildMembers', GuildMemberSchema);

export { GuildMemberSchema }