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
const Invite: Schema = {
    type: Object,
    data: {
        id: {
            name: '_id',
            expected: String,
            default: null,
            extended: false
        },
        Expires: {
            name: 'Expires',
            expected: Date,
            default: null,
            extended: false
        },
        Uses: {
            name: 'Uses',
            expected: Number,
            default: 0,
            extended: false
        },
        MaxUses: {
            name: 'MaxUses',
            expected: Number,
            default: null,
            extended: false
        },
        Creator: {
            name: 'Creator',
            extended: true,
            extends: 'GuildMember',
        },
        Deleteable: {
            name: 'Deleteable',
            expected: Boolean,
            default: true,
            extended: false
        },
    },
};

export default Invite;

export { Invite }