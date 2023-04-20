import { Route } from '@kastelll/core';
import User from '../../../../../../Middleware/User';

new Route(
	'/',
	'DELETE',
	[
		User({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'User',
		}),
	],
	async (req, res) => {},
);
