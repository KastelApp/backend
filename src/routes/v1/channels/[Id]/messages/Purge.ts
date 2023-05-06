import { Route } from '@kastelll/core';
import { HTTPErrors } from '@kastelll/util';
import User from '../../../../../Middleware/User.js';

new Route(
	'/purge',
	'DELETE',
	[
		User({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'All',
			Flags: [],
		}),
	],
	async (req, res) => {
		const { Id } = req.params as { Id: string };
		const { messageIds } = req.body as { messageIds: string[] };

		const CanDelete = await req.mutils.Channel.hasPermission(Id, ['ManageMessages', 'Administrator'], true);

		if (!CanDelete) {
			const MissingPermissions = new HTTPErrors(4_021);

			MissingPermissions.AddError({
				Channel: {
					code: 'MissingPermissions',
					message: 'You are missing the permissions to manage messages in this channel.',
				},
			});

			res.status(403).json(MissingPermissions.toJSON());

			return;
		}

		if (!messageIds || messageIds.length < 1 || messageIds.length > 100) {
			const Errors = new HTTPErrors(4_051);

			Errors.AddError({
				MessageIds: {
					code: 'InvalidMessageIds',
					message: 'The message ids are invalid.',
				},
			});

			res.status(400).json(Errors.toJSON());

			return;
		}

		const DeletedMessages = await req.mutils.Channel.deleteMessages(Id, messageIds);

		if (!DeletedMessages) {
			const Errors = new HTTPErrors(4_052);

			Errors.AddError({
				MessageIds: {
					code: 'InvalidMessageIds',
					message: 'The message ids are invalid.',
				},
			});

			res.status(400).json(Errors.toJSON());

			return;
		}

		res.status(204).send();
	},
);
