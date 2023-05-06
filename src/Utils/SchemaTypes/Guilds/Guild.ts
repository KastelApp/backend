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

const Guild: Schema = {
	type: Object,
	data: {
		Id: {
			name: '_id',
			expected: String,
			default: null,
			extended: false,
		},
		Name: {
			name: 'Name',
			expected: String,
			default: 'Unknown Guild Name',
			extended: false,
		},
		Description: {
			name: 'Description',
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
		Owner: {
			name: 'Owner',
			extended: true,
			extends: 'GuildMember',
		},
		CoOwners: {
			name: 'CoOwners',
			extended: true,
			extends: 'GuildMembers',
		},
		Channels: {
			name: 'Channels',
			extended: true,
			extends: 'Channels',
		},
		Roles: {
			name: 'Roles',
			extended: true,
			extends: 'Roles',
		},
		Bans: {
			name: 'Bans',
			extended: true,
			extends: 'Bans',
		},
		Members: {
			name: 'Members',
			extended: true,
			extends: 'GuildMembers',
		},
		Invites: {
			name: 'Invites',
			extended: true,
			extends: 'Invites',
		},
		Emojis: {
			name: 'Emojis',
			extended: true,
			extends: 'Emojis',
		},
		MaxMembers: {
			name: 'MaxMembers',
			extended: false,
			expected: Number,
			default: 100,
		},
	},
};

export default Guild;

export { Guild };
