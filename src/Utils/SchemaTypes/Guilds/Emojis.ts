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

const Emojis: Schema = {
	type: Array,
	data: {
		Id: {
			name: '_id',
			expected: String,
			default: null,
			extended: false,
		},
		Creator: {
			name: 'Creator',
			expected: String,
			default: null,
			extended: false,
		},
		Name: {
			name: 'Name',
			expected: String,
			default: null,
			extended: false,
		},
		EmojiHash: {
			name: 'EmojiHash',
			expected: String,
			default: null,
			extended: false,
		},
		Disabled: {
			name: 'Disabled',
			expected: Boolean,
			default: false,
			extended: false,
		},
		Public: {
			name: 'Public',
			expected: Boolean,
			default: false,
			extended: false,
		},
	},
};

export default Emojis;

export { Emojis };
