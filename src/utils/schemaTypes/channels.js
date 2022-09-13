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

const { CHANNEL_TYPES, ALLOWED_MENTIONS } = require('../../constants');

/**
 * @type {import("../../..").Schema}
 */
const channels = {
    type: Array,
    data: {
        id: {
            name: '_id',
            expected: String,
            default: null,
        },
        name: {
            name: 'name',
            expected: String,
            default: 'Unknown Channel Name',
        },
        description: {
            name: 'description',
            expected: String,
            default: null,
        },
        type: {
            name: 'type',
            expected: Number,
            default: CHANNEL_TYPES.GUILD_TEXT,
        },
        nsfw: {
            name: 'nsfw',
            expected: Boolean,
            default: false,
        },
        allowed_mentions: {
            name: 'allowed_mentions',
            expected: Number,
            default: ALLOWED_MENTIONS.ALL,
        },
        parent: {
            name: 'parent',
            expected: String,
            default: null,
        },
        children: {
            name: 'children',
            expected: Array,
            default: null,
        },
        position: {
            name: 'position',
            expected: Number,
            default: 0,
        },
        permissions: {
            name: 'permissions',
            expected: Number,
            default: 0,
        },
    },
};

module.exports = channels;