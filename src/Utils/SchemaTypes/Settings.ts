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

import type { Schema } from "../../Types/Schema";

const Settings: Schema = {
    type: Object,
    data: {
        User: {
            name: 'User',
            extended: true,
            extends: 'User',
        },
        Status: {
            name: 'Status',
            expected: String,
            default: null,
            extended: false
        },
        Presence: {
            name: 'Presence',
            expected: Number,
            default: 0,
            extended: false
        },
        Tokens: {
            name: 'Tokens',
            expected: Array,
            default: [],
            extended: false
        }
    },
};

export default Settings;

export { Settings }