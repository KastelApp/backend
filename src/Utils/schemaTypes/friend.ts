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
const Friend: Schema = {
    type: Object,
    data: {
        Sender: {
            name: 'Sender',
            extended: true,
            extends: 'FriendUser',
        },
        Receiver: {
            name: 'Receiver',
            extended: true,
            extends: 'FriendUser',
        },
        Nickname: {
            name: 'Nickname',
            expected: String,
            default: null,
            extended: false,
        },
        Accepted: {
            name: 'Accepted',
            expected: Boolean,
            default: false,
            extended: false,
        },
    },
};

export default Friend;

export { Friend }