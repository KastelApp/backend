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

import type { Schema } from '../../../Types/Schema';

const PermissionsOverides: Schema = {
	type: Array,
	data: {
		Allow: {
			name: 'Allow',
			expected: String,
			default: '0',
			extended: false,
		},
		Deny: {
			name: 'Deny',
			expected: String,
			default: '0',
			extended: false,
		},
		Type: {
			name: 'Type',
			expected: Number,
			default: 0,
			extended: false,
		},
		Editable: {
			name: 'Editable',
			expected: Boolean,
			default: false,
			extended: false,
		},
	},
};

const PermissionsOveride: Schema = {
	type: Object,
	data: PermissionsOverides.data,
};

export default PermissionsOverides;

export { PermissionsOverides, PermissionsOveride };
