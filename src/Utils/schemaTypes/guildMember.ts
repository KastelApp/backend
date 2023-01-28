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

/**
 * @type {import("../../..").Schema}
 */
const guildMember = {
    type: Object,
    data: {
        id: {
            name: '_id',
            expected: String,
            default: null,
        },
        user: {
            name: 'user',
            extended: true,
            extends: 'friendUser',
        },
        roles: {
            name: 'roles',
            extended: true,
            extends: 'roles',
        },
        nickname: {
            name: 'nickname',
            expected: String,
            default: null,
        },
    },
};

module.exports = guildMember;