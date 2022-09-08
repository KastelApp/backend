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
const friendUser = {
    type: Object,
    data: {
        id: {
            name: "_id",
            expected: String,
            default: null
        },
        username: {
            name: "username",
            expected: String,
            default: "Unknown Username"
        },
        tag: {
            name: "tag",
            expected: String,
            default: "0000"
        },
        creation_date: {
            name: "created_date",
            expected: Date,
            default: Date.now()
        },
        badges: {
            name: "badges",
            expected: Number,
            default: 0
        }
    }
}

module.exports = friendUser