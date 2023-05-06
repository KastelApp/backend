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

import { Route } from '@kastelll/core';
import User from '../../../../Middleware/User.js';
import RateLimit from '../../../../Utils/Classes/TokenBucket';

new Route(
	'/test',
	'GET',
	[
		User({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'User',
			Flags: [],
		}),
		RateLimit({
			Count: 5,
			Window: 10_000,
			Bucket: 'test',
			// failed: {
			//   boost: 1000000,
			//   count: 3
			// },
			Error: true,
		}),
	],
	async (req, res) => {
		res.status(403).send('uwu');

		// res.send('uwu')
	},
);
