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

import type { Schema } from "../../../Types/Schema";

const Message: Schema = {
    type: Object,
    data: {
        Id: {
            name: '_id',
            expected: String,
            default: null,
            extended: false
        },
        Author: {
            name: 'Author',
            extends: 'GuildMember',
            extended: true,
        },
        Content: {
            name: 'Content',
            expected: String,
            default: null,
            extended: false
        },
        AllowedMentions: {
            name: 'AllowedMentions',
            expected: Number,
            default: 0,
            extended: false
        },
        CreatedAt: {
            name: 'CreatedAt',
            expected: Number,
            default: 0,
            extended: false
        },
        UpdatedAt: {
            name: 'UpdatedAt',
            expected: Number,
            default: 0,
            extended: false
        }
    },
};

const Messages: Schema = {
    type: Object,
    data: Message.data
};

export default Message;

export { Message, Messages }