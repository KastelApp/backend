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

const GuildMember: Schema = {
	type: Object,
	data: {
		Id: {
			name: '_id',
			expected: String,
			default: null,
			extended: false,
		},
		User: {
			name: 'User',
			extended: true,
			extends: 'FriendUser',
		},
		Roles: {
			name: 'Roles',
			extended: true,
			extends: 'Roles',
		},
		Nickname: {
			name: 'Nickname',
			expected: String,
			default: null,
			extended: false,
		},
		JoinedAt: {
			name: 'JoinedAt',
			expected: Number,
			default: Date.now(),
			extended: false,
		},
	},
};

// NR = No Roles
const GuildMemberNR: Schema = {
	type: Object,
	data: {
		Id: {
			name: '_id',
			expected: String,
			default: null,
			extended: false,
		},
		User: {
			name: 'User',
			extended: true,
			extends: 'FriendUser',
		},
		Roles: {
			name: 'Roles',
			expected: Array,
			default: [],
			extended: false,
		},
		Nickname: {
			name: 'Nickname',
			expected: String,
			default: null,
			extended: false,
		},
		JoinedAt: {
			name: 'JoinedAt',
			expected: Number,
			default: Date.now(),
			extended: false,
		},
	},
};

export default GuildMember;

export { GuildMember, GuildMemberNR };
