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

const GuildMembers: Schema = {
	type: Array,
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

export default GuildMembers;

export { GuildMembers };
