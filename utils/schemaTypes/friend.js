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
const friend = {
    type: Object,
    data: {
        sender: {
            name: "sender",
            extended: true,
            extends: "friendUser"
        },
        receiver: {
            name: "receiver",
            extended: true,
            extends: "friendUser"
        },
        nickname: {
            name: "nickname",
            expected: String,
            default: null
        },
        accepted: {
            name: "accepted",
            expected: Boolean,
            default: false
        }
    }
}

module.exports = friend