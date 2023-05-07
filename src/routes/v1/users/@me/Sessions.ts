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

new Route(
	'/sessions',
	'GET',
	[
		User({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'User',
			Flags: [],
		}),
	],
	async (req, res) => {
		const UsersSessions = await req.mutils.User.getSessions();

		res.json(
			UsersSessions.map((Session) => {
				return {
					Token: Session.Token.replaceAll(/./g, '*'),
					CreatedAt: Session.CreatedDate,
					Ip: Session.Ip,
				};
			}),
		);
	},
);
