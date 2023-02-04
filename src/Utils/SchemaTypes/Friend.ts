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
        Flags: {
            name: 'Flags',
            expected: Number,
            default: RelationshipFlags.Friend, // default to friend ig (idk what else to have it default to, blocked maybe?)
            extended: false,
        },
    },
};

export default Friend;

export { Friend }