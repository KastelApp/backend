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
const FriendUser: Schema = {
    type: Object,
    data: {
        id: {
            name: '_id',
            expected: String,
            default: null,
            extended: false
        },
        AvatarHash: {
            name: 'AvatarHash',
            expected: String,
            default: null,
            extended: false
        },
        Username: {
            name: 'Username',
            expected: String,
            default: 'Unknown Username',
            extended: false
        },
        Tag: {
            name: 'Tag',
            expected: String,
            default: '0000',
            extended: false
        },
        CreationDate: {
            name: 'CreationDate',
            expected: Number,
            default: Date.now(),
            extended: false
        },
        Flags: {
            name: 'Flags',
            expected: Number,
            default: 0,
            extended: false
        }
    },
};

export default FriendUser;

export { FriendUser }