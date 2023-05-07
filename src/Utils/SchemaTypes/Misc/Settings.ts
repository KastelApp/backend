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
			extended: false,
		},
		Presence: {
			name: 'Presence',
			expected: Number,
			default: 0,
			extended: false,
		},
		Tokens: {
			name: 'Tokens',
			extends: 'Tokens',
			extended: true,
		},
		Theme: {
			name: 'Theme',
			expected: String,
			default: 'dark',
			extended: false,
		},
		Language: {
			name: 'Language',
			expected: String,
			default: 'en-US',
			extended: false,
		},
		Privacy: {
			name: 'Privacy',
			expected: Number,
			default: 0,
			extended: false,
		},
		Mentions: {
			name: 'Mentions',
			extended: true,
			extends: 'Mentions',
		},
	},
};

export default Settings;

export { Settings };
