import { Route } from '@kastelll/core';
import Constants, { VerificationFlags } from '../../../Constants';
import Captcha from '../../../Middleware/Captcha';
import { HTTPErrors } from '@kastelll/util';
import { UserSchema, VerifcationLinkSchema } from '../../../Utils/Schemas/Schemas';
import Encryption from '../../../Utils/Classes/Encryption';
import LinkGeneration from '../../../Utils/Classes/LinkGeneration';

new Route(
	'/verify',
	'POST',
	[
		Captcha({
			Enabled: Constants.Settings.Captcha.ForgotPassword,
		}),
	],
	async (req, res) => {
		const { code }: { code: string } = req.body;

		if (!code) {
			const MissingCode = new HTTPErrors(4019);

			MissingCode.AddError({
				Code: {
					Code: 'MissingOrInvalidCode',
					Message: 'Missing or invalid code',
				},
			});

			res.status(400).json(MissingCode.toJSON());

			return;
		}

		const Link = await VerifcationLinkSchema.findOne({
			_id: Encryption.encrypt(LinkGeneration.GetSnowflake(code) as string),
			Code: Encryption.encrypt(code),
			Ip: Encryption.encrypt(req.clientIp),
			Flags: VerificationFlags.VerifyEmail,
		});

		if (!Link) {
			const InvalidCode = new HTTPErrors(4019);

			InvalidCode.AddError({
				Code: {
					Code: 'MissingOrInvalidCode',
					Message: 'Missing or invalid code',
				},
			});

			res.status(400).json(InvalidCode.toJSON());

			return;
		}

		if (Link.ExpireDate < Date.now()) {
			const ExpiredCode = new HTTPErrors(4100);

			ExpiredCode.AddError({
				Code: {
					Code: 'ExpiredCode',
					Message: 'Expired code',
				},
			});

			res.status(400).json(ExpiredCode.toJSON());

			return;
		}

		await VerifcationLinkSchema.deleteOne({
			_id: Link._id,
		});

		await UserSchema.updateOne(
			{
				_id: Link.User,
			},
			{
				$set: {
					EmailVerified: true,
				},
			},
		);

		res.status(204).send();
	},
);