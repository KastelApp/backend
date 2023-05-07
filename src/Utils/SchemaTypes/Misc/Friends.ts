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

const Friends: Schema = {
	type: Array,
	data: {
		Flags: {
			name: 'Flags',
			expected: Number,
			default: 0,
			extended: false,
		},
		Sender: {
			name: 'Sender',
			extends: 'RawUser',
			extended: true,
		},
		Receiver: {
			name: 'Receiver',
			extends: 'RawUser',
			extended: true,
		},
		SenderNickname: {
			name: 'SenderNickname',
			expected: String,
			default: null,
			extended: false,
		},
		ReceiverNickname: {
			name: 'ReceiverNickname',
			expected: String,
			default: null,
			extended: false,
		},
	},
};

export default Friends;

export { Friends };
