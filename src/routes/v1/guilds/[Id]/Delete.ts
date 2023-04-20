import { HTTPErrors } from '@kastelll/util';
import { Route } from '@kastelll/core';
import Constants from '../../../../Constants';
import User from '../../../../Middleware/User';
import Encryption from '../../../../Utils/Classes/Encryption';
import {
	BanSchema,
	ChannelSchema,
	EmojiSchema,
	GuildMemberSchema,
	GuildSchema,
	InviteSchema,
	RoleSchema,
} from '../../../../Utils/Schemas/Schemas';

interface RequestBody {
	twofaCode: string;
}

new Route(
	'/',
	'DELETE',
	[
		User({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'All',
			DisallowedFlags: ['GuildBan'],
		}),
	],
	async (req, res) => {
		const { twofaCode } = req.body as RequestBody;

		const { Id } = req.params as { Id: string };

		const GuildData = await GuildSchema.findById(Encryption.encrypt(Id));

		if (!GuildData) {
			const Errors = new HTTPErrors(4020);

			Errors.AddError({
				Guild: {
					Code: 'InvalidGuild',
					Message: 'The guild you are trying to fetch does not exist or you do not have permission to view it.',
				},
			});

			res.status(400).json(Errors.toJSON());

			return;
		}

		const UserOwnerOfGuild = await GuildMemberSchema.findOne({
			User: Encryption.encrypt(req.user.Id),
			Guild: Encryption.encrypt(Id),
			Flags: Constants.GuildMemberFlags.Owner | Constants.GuildMemberFlags.In,
		});

		if (!UserOwnerOfGuild) {
			const Errors = new HTTPErrors(4021);

			Errors.AddError({
				Guild: {
					Code: 'InvalidGuild',
					Message: 'You do not have permission to delete this guild.',
				},
			});

			res.status(400).json(Errors.toJSON());

			return;
		}

		if (req.user.TwoFa && !twofaCode) {
			const Errors = new HTTPErrors(4018);

			Errors.AddError({
				TwoFa: {
					Code: 'MissingTwoFa',
					Message: 'You must provide a two factor authentication code.',
				},
			});

			res.status(400).json(Errors.toJSON());

			return;
		}

		if (req.user.TwoFa && twofaCode) {
			// Todo: Add 2fa check
		}

		for (const Member of GuildData.Members) {
			await GuildMemberSchema.deleteOne({ _id: Member });
		}

		for (const Channel of GuildData.Channels) {
			await ChannelSchema.deleteOne({ _id: Channel });
		}

		for (const Role of GuildData.Roles) {
			await RoleSchema.deleteOne({ _id: Role });
		}

		for (const Emoji of GuildData.Emojis) {
			await EmojiSchema.deleteOne({ _id: Emoji });
		}

		for (const Invite of GuildData.Invites) {
			await InviteSchema.deleteOne({ _id: Invite });
		}

		for (const Ban of GuildData.Bans) {
			await BanSchema.deleteOne({ _id: Ban });
		}

		await GuildData.deleteOne();

		res.status(200).json({
			Success: true,
			Message: 'Successfully deleted guild.',
		});
	},
);
