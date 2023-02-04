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

import { RelationshipFlags } from "../../Constants";
import type { Schema } from "../../Types/Schema";

const Friends: Schema = {
    type: Array,
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
        Flags: {
            name: 'Flags',
            expected: Number,
            default: RelationshipFlags.Friend,
            extended: false,
        },
    },
};

export default Friends;

export { Friends }