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

const Tokens: Schema = {
	type: Object,
	data: {
		Token: {
			name: 'Token',
			expected: String,
			default: null,
			extended: false,
		},
		CreatedDate: {
			name: 'CreatedDate',
			expected: Number,
			default: null,
			extended: false,
		},
		Ip: {
			name: 'Ip',
			expected: String,
			default: null,
			extended: false,
		},
	},
};

export default Tokens;

export { Tokens };
