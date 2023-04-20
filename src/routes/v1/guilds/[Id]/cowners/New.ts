import { Route } from '@kastelll/core';
import User from '../../../../../Middleware/User';

new Route(
	'/',
	'POST',
	[
		User({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'User',
		}),
	],
	async (req, res) => {},
);
