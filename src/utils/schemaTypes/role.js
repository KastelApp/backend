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

const { ALLOWED_MENTIONS } = require('../../constants');

/**
 * @type {import("../../..").Schema}
 */
const role = {
    type: Object,
    data: {
        id: {
            name: '_id',
            expected: String,
            default: null,
        },
        name: {
            name: 'name',
            expected: String,
            default: 'Unknown Role Name',
        },
        allowed_nsfw: {
            name: 'allowed_nsfw',
            expected: Boolean,
            default: false,
        },
        deleteable: {
            name: 'deleteable',
            expected: Boolean,
            default: true,
        },
        allowed_mentions: {
            name: 'allowed_mentions',
            expected: Number,
            default: ALLOWED_MENTIONS.ALL,
        },
        hoisted: {
            name: 'hoisted',
            expected: Boolean,
            default: false,
        },
        color: {
            name: 'color',
            expected: String,
            default: '#ff7f50',
        },
        permissions: {
            name: 'permissions',
            expected: Number,
            default: 0,
        },
    },
};

module.exports = role;