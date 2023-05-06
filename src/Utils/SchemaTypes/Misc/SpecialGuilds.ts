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

// NCW = No Coowner & owner
const SpecialGuildsNCW: Schema = {
	type: Array,
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
			extended: false,
			expected: String,
			default: null,
		},
		CoOwners: {
			name: 'CoOwners',
			extended: false,
			expected: Array,
			default: [],
		},
		Channels: {
			name: 'Channels',
			extended: false,
			expected: Array,
			default: [],
		},
		Roles: {
			name: 'Roles',
			extended: false,
			expected: Array,
			default: [],
		},
		Bans: {
			name: 'Bans',
			extended: false,
			expected: Array,
			default: [],
		},
		Members: {
			name: 'Members',
			extended: false,
			expected: Array,
			default: [],
		},
		Invites: {
			name: 'Invites',
			extended: false,
			expected: Array,
			default: [],
		},
		MaxMembers: {
			name: 'MaxMembers',
			extended: false,
			expected: Number,
			default: 100,
		},
		Emojis: {
			name: 'Emojis',
			extended: false,
			expected: Array,
			default: [],
		},
	},
};

// NC = No Coowner
const SpecialGuildsNC: Schema = {
	type: Array,
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
			extended: false,
			expected: Array,
			default: [],
		},
		Channels: {
			name: 'Channels',
			extended: false,
			expected: Array,
			default: [],
		},
		Roles: {
			name: 'Roles',
			extended: false,
			expected: Array,
			default: [],
		},
		Bans: {
			name: 'Bans',
			extended: false,
			expected: Array,
			default: [],
		},
		Members: {
			name: 'Members',
			extended: false,
			expected: Array,
			default: [],
		},
		Invites: {
			name: 'Invites',
			extended: false,
			expected: Array,
			default: [],
		},
		MaxMembers: {
			name: 'MaxMembers',
			extended: false,
			expected: Number,
			default: 100,
		},
		Emojis: {
			name: 'Emojis',
			extended: false,
			expected: Array,
			default: [],
		},
	},
};

// NW = No Owner
const SpecialGuildsNW: Schema = {
	type: Array,
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
			extended: false,
			expected: String,
			default: null,
		},
		CoOwners: {
			name: 'CoOwners',
			extended: true,
			extends: 'GuildMembers',
		},
		Channels: {
			name: 'Channels',
			extended: false,
			expected: Array,
			default: [],
		},
		Roles: {
			name: 'Roles',
			extended: false,
			expected: Array,
			default: [],
		},
		Bans: {
			name: 'Bans',
			extended: false,
			expected: Array,
			default: [],
		},
		Members: {
			name: 'Members',
			extended: false,
			expected: Array,
			default: [],
		},
		Invites: {
			name: 'Invites',
			extended: false,
			expected: Array,
			default: [],
		},
		MaxMembers: {
			name: 'MaxMembers',
			extended: false,
			expected: Number,
			default: 100,
		},
		Emojis: {
			name: 'Emojis',
			extended: false,
			expected: Array,
			default: [],
		},
	},
};

export { SpecialGuildsNCW, SpecialGuildsNC, SpecialGuildsNW };
