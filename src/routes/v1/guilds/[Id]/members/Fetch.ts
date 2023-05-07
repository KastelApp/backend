import { Route } from '@kastelll/core';
import User from '../../../../../Middleware/User.js';

// Only allows for fetching the first 100 members

new Route(
	'/',
	'GET',
	[
		User({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'All',
		}),
	],
	async (req, res) => {},
);
