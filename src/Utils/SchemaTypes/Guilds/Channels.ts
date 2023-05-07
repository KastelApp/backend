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

import { ChannelTypes, AllowedMentions } from '../../../Constants.js';
import type { Schema } from '../../../Types/Schema';

const Channels: Schema = {
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
			default: 'Unknown Channel Name',
			extended: false,
		},
		Description: {
			name: 'Description',
			expected: String,
			default: null,
			extended: false,
		},
		Type: {
			name: 'Type',
			expected: Number,
			default: ChannelTypes.GuildText,
			extended: false,
		},
		Nsfw: {
			name: 'Nsfw',
			expected: Boolean,
			default: false,
			extended: false,
		},
		AllowedMentions: {
			name: 'AllowedMentions',
			expected: Number,
			default: AllowedMentions.All,
			extended: false,
		},
		Parent: {
			name: 'Parent',
			expected: String,
			default: null,
			extended: false,
		},
		Children: {
			name: 'Children',
			expected: Array,
			default: null,
			extended: false,
		},
		Position: {
			name: 'Position',
			expected: Number,
			default: 0,
			extended: false,
		},
		Permissions: {
			name: 'Permissions',
			expected: Number,
			default: 0,
			extended: false,
		},
	},
};

export default Channels;

export { Channels };
