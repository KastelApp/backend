import { Route } from '@kastelll/core';
import { HTTPErrors } from '@kastelll/util';
import User from '../../../../../../Middleware/User.js';

new Route(
	'/',
	'DELETE',
	[
		User({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'All',
			Flags: [],
		}),
	],
	async (req, res) => {
		const { Id, MessageId } = req.params as { Id: string; MessageId: string };

		const CanDelete = await req.mutils.Channel.hasPermission(Id, ['ManageMessages', 'Administrator'], true);

		const Message = await req.mutils.Channel.fetchMessage(Id, MessageId);

		if (!Message) {
			const Errors = new HTTPErrors(4_052);

			Errors.AddError({
				MessageIds: {
					Code: 'InvalidMessageIds',
					Message: 'The message ids are invalid.',
				},
			});

			res.status(400).json(Errors.toJSON());

			return;
		}

		if (!CanDelete && Message.Author.User.Id !== req.user.Id) {
			const MissingPermissions = new HTTPErrors(4_021);

			MissingPermissions.AddError({
				Channel: {
					Code: 'MissingPermissions',
					Message: 'You are missing the permissions to manage messages in this channel.',
				},
			});

			res.status(403).json(MissingPermissions.toJSON());

			return;
		}

		const DeletedMessage = await req.mutils.Channel.deleteMessages(Id, [MessageId]);

		if (!DeletedMessage) {
			const Errors = new HTTPErrors(4_052);

			Errors.AddError({
				MessageIds: {
					Code: 'InvalidMessageIds',
					Message: 'The message ids are invalid.',
				},
			});

			res.status(400).json(Errors.toJSON());

			return;
		}

		res.status(204).end();

		req.app.socket.Events.MessageDelete({
			Id: MessageId,
			AuthorId: Message.Author.User.Id,
			ChannelId: Id,
			Timestamp: Date.now(),
		});
	},
);
