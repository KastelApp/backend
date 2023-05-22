import { Route } from '@kastelll/core';
import { HTTPErrors } from '@kastelll/util';
import User from '../../../../../../Middleware/User.js';

interface MessageBody {
	allowedMentions: number;
	content: string;
	embeds: {
		color?: number;
		description?: string;
		fields?: {
			title: string;
			value: string;
		}[];
		footer?: {
			text: string;
		};
		timestamp?: number;
		title?: string;
	}[];
	flags: number;
}

new Route(
	'/',
	'PATCH',
	[
		User({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'All',
			Flags: [],
		}),
	],
	async (req, res) => {
		const { Id, MessageId } = req.params as { Id: string; MessageId: string };

		const { content, allowedMentions } = req.body as MessageBody;

		const CanEdit = await req.mutils.Channel.hasPermission(Id, ['SendMessages', 'Administrator'], true);

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

		if (!CanEdit && Message.Author.User.Id !== req.user.Id) {
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

		const EditedMessage = await req.mutils.Channel.editMessage(Id, MessageId, content, allowedMentions);

		if (!EditedMessage) {
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

		res.status(200).json(EditedMessage);

		req.app.socket.Events.MessageUpdate({
			...EditedMessage,
			ChannelId: Id,
		});
	},
);
