import { Route } from '@kastelll/core';
import User from '../../../../../../Middleware/User.js';

new Route(
	'/',
	'GET',
	[
		User({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'All',
			Flags: ['Bot'],
		}),
	],
	async (req, res) => {},
);
