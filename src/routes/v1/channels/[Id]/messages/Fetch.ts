import { Route } from '@kastelll/core';
import { HTTPErrors } from '@kastelll/util';
import User from '../../../../../Middleware/User.js';

new Route(
	'/',
	'GET',
	[
		User({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'All',
			Flags: [],
		}),
	],
	async (req, res) => {
		const { Id } = req.params as { Id: string };
		const { limit, before, after } = req.query as { after: string; before: string; limit: string };

		const CanRead = await req.mutils.Channel.hasPermission(Id, ['ReadMessages', 'Administrator'], true);

		if (!CanRead) {
			const MissingPermissions = new HTTPErrors(4_021);

			MissingPermissions.AddError({
				Channel: {
					code: 'MissingPermissions',
					message: 'You are missing the permissions to read messages in this channel.',
				},
			});

			res.status(403).json(MissingPermissions.toJSON());

			return;
		}

		const Limit = isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100 ? 50 : Number(limit);
		const Before = before ? (req.app.snowflake.Validate(before) ? before : undefined) : undefined;
		const After = after ? (req.app.snowflake.Validate(after) ? after : undefined) : undefined;
		const msgs = await req.mutils.Channel.fetchMessages(Id, Limit, Before, After);

		res.json(msgs || []);
	},
);
