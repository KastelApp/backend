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
 * @type {import('./SchemaTypes').Schema}
 */
const invite = {
    type: Object,
    data: {
        id: {
            name: '_id',
            expected: String,
            default: null,
        },
        expires: {
            name: 'expires',
            expected: Date,
            default: null,
        },
        uses: {
            name: 'uses',
            expected: Number,
            default: 0,
        },
        max_uses: {
            name: 'max_uses',
            expected: Number,
            default: null,
        },
        creator: {
            name: 'creator',
            extended: true,
            extends: 'guildMember',
        },
        deleteable: {
            name: 'deleteable',
            expected: Boolean,
            default: true,
        },
    },
};

module.exports = invite;