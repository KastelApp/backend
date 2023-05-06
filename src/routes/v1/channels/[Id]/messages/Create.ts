import { Route } from '@kastelll/core';
import { HTTPErrors } from '@kastelll/util';
import Constants, { MessageFlags } from '../../../../../Constants.js';
import User from '../../../../../Middleware/User.js';
import FlagRemover from '../../../../../Utils/Classes/BitFields/FlagRemover';
import Encryption from '../../../../../Utils/Classes/Encryption.js';
import schemaData from '../../../../../Utils/SchemaData.js';
import { MessageSchema } from '../../../../../Utils/Schemas/Schemas.js';

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
	nonce: string;
	replyingTo?: string;
}

new Route(
	'/',
	'POST',
	[
		User({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'All',
			Flags: [],
		}),
	],
	async (req, res) => {
		const { content, nonce, replyingTo, allowedMentions } = req.body as MessageBody;
		const { Id } = req.params as { Id: string };

		const CommonErrors = new HTTPErrors(4_050);

		if (!content)
			CommonErrors.AddError({
				Content: {
					code: 'MissingContent',
					message: 'The content of the message is missing.',
				},
			});

		if (content?.length > Constants.Settings.Max.MessageLength)
			CommonErrors.AddError({
				Content: {
					code: 'MessageTooLong',
					message: 'The message is too long.',
				},
			});

		if (Object.keys(CommonErrors.Errors).length > 0) {
			res.status(400).json(CommonErrors.toJSON());

			return;
		}

		if (nonce) {
			const NonceExists = await MessageSchema.exists({
				Channel: Id,
				Nonce: nonce,
				Author: req.user.Id,
			});

			if (NonceExists)
				CommonErrors.AddError({
					Nonce: {
						code: 'NonceExists',
						message: 'The nonce you provided already exists.',
					},
				});

			if (Object.keys(CommonErrors.Errors).length > 0) {
				res.status(400).json(CommonErrors.toJSON());

				return;
			}
		}

		const CanSend = await req.mutils.Channel.hasPermission(Id, ['SendMessages', 'Administrator'], true);

		if (!CanSend) {
			const MissingPermissions = new HTTPErrors(4_021);

			MissingPermissions.AddError({
				Content: {
					code: 'UnknownChannel',
					message:
						'The channel you are trying to send a message to does not exist or you do not have permission to send messages to it.',
				},
			});

			res.status(403).json(MissingPermissions.toJSON());

			return;
		}

		const FetchedAuthor = await req.mutils.User.getMemberFromChannel(Id, req.user.Id);

		if (!FetchedAuthor) {
			throw new new HTTPErrors(4_050).AddError({
				GuildMember: {
					code: 'UnknownMember',
					message: 'The Member that tried to send a message does not exist.',
				},
			});
		}

		const Message = new MessageSchema({
			_id: Encryption.encrypt(req.app.snowflake.Generate()),
			Channel: Encryption.encrypt(Id),
			Author: Encryption.encrypt(FetchedAuthor._id),
			Content: Encryption.encrypt(content),
			Nonce: Encryption.encrypt(nonce),
			CreatedDate: Date.now(),
			Flags: replyingTo ? MessageFlags.Reply : MessageFlags.Normal,
			ReplyingTo: replyingTo ? Encryption.encrypt(replyingTo) : null,
			AllowedMentions: allowedMentions,
		});

		await Message.save();

		const Schemad = schemaData(
			'Message',
			Encryption.completeDecryption({
				...Message.toJSON(),
				Author: FetchedAuthor,
			}),
		);

		const FixedData = {
			...Schemad,
			Author: {
				...Schemad.Author,
				User: {
					...Schemad.Author.User,
					PublicFlags: Number(FlagRemover.NormalFlags(BigInt(FetchedAuthor?.Flags || 0))),
				},
			},
		};

		res.json(FixedData);

		req.app.socket.Events.MessageCreate({
			...FixedData,
			ChannelId: Id,
		});
	},
);
