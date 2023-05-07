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

const User: Schema = {
	type: Array,
	data: {
		Id: {
			name: '_id',
			expected: String,
			default: null,
			extended: false,
		},
		AvatarHash: {
			name: 'AvatarHash',
			expected: String,
			default: null,
			extended: false,
		},
		Email: {
			name: 'Email',
			expected: String,
			default: null,
			extended: false,
		},
		Username: {
			name: 'Username',
			expected: String,
			default: 'Unknown Username',
			extended: false,
		},
		Tag: {
			name: 'Tag',
			expected: String,
			default: '0000',
			extended: false,
		},
		TwoFa: {
			name: 'TwoFa',
			expected: Boolean,
			default: false,
			extended: false,
		},
		TwoFaVerified: {
			name: 'TwoFaVerified',
			expected: Boolean,
			default: false,
			extended: false,
		},
		Flags: {
			name: 'Flags',
			expected: Number,
			default: 0,
			extended: false,
		},
	},
};

export default User;

export { User };
