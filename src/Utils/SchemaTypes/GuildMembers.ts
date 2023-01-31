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

import { Schema } from "../../Types/Schema";

/**
 * @type {import("../../..").Schema}
 */
const GuildMembers: Schema = {
    type: Array,
    data: {
        id: {
            name: '_id',
            expected: String,
            default: null,
            extended: false
        },
        User: {
            name: 'User',
            extended: true,
            extends: 'FriendUser',
        },
        Roles: {
            name: 'Roles',
            extended: true,
            extends: 'Roles',
        },
        Nickname: {
            name: 'Nickname',
            expected: String,
            default: null,
            extended: false
        },
    },
};

export default GuildMembers;

export { GuildMembers }