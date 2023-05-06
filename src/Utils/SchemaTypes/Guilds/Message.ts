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

const Message: Schema = {
	type: Object,
	data: {
		Id: {
			name: '_id',
			expected: String,
			default: null,
			extended: false,
		},
		Author: {
			name: 'Author',
			extends: 'GuildMemberNR',
			extended: true,
		},
		Content: {
			name: 'Content',
			expected: String,
			default: null,
			extended: false,
		},
		AllowedMentions: {
			name: 'AllowedMentions',
			expected: Number,
			default: 0,
			extended: false,
		},
		CreatedAt: {
			name: 'CreatedDate',
			expected: Number,
			default: null,
			extended: false,
		},
		UpdatedAt: {
			name: 'UpdatedDate',
			expected: Number,
			default: null,
			extended: false,
		},
		Nonce: {
			name: 'Nonce',
			expected: String,
			default: null,
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

const Messages: Schema = {
	type: Array,
	data: Message.data,
};

export default Message;

export { Message, Messages };
