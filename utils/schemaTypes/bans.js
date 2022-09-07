/*! 
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
const bans = {
    type: Array,
    data: {
        id: {
            name: "_id",
            expected: String,
            default: null
        },
        user: {
            name: "user",
            extended: true,
            extends: "friendUser"
        },
        banner: {
            name: "banner",
            extended: true,
            extends: "friendUser"
        },
        reason: {
            name: "reason",
            expected: String,
            default: "N/A"
        },
        ban_date: {
            name: "banned_date",
            expected: Date,
            default: Date.now()
        },
        unban_date: {
            name: "unban_date",
            expected: Date,
            default: null
        }
    }
}

module.exports = bans