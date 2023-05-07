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

import { AllowedMentions } from '../../../Constants.js';
import type { Schema } from '../../../Types/Schema';

const Role: Schema = {
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
			default: 'Unknown Role Name',
			extended: false,
		},
		AllowedNsfw: {
			name: 'AllowedNsfw',
			expected: Boolean,
			default: false,
			extended: false,
		},
		Deleteable: {
			name: 'Deleteable',
			expected: Boolean,
			default: true,
			extended: false,
		},
		AllowedMentions: {
			name: 'AllowedMentions',
			expected: Number,
			default: AllowedMentions.All,
			extended: false,
		},
		Hoisted: {
			name: 'Hoisted',
			expected: Boolean,
			default: false,
			extended: false,
		},
		Color: {
			name: 'Color',
			expected: Number,
			default: 16_744_272,
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

export default Role;

export { Role };
