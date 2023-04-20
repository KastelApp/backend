import { Route } from '@kastelll/core';
import Constants from '../../Constants';
import Captcha from '../../Middleware/Captcha';
import { HTTPErrors } from '@kastelll/util';
import { UserSchema } from '../../Utils/Schemas/Schemas';
import Encryption from '../../Utils/Classes/Encryption';

new Route(
	'/forgot',
	'POST',
	[
		Captcha({
			Enabled: Constants.Settings.Captcha.ForgotPassword,
		}),
	],
	async (req, res) => {
		const { email }: { email: string } = req.body;

		if (!email) {
			const Errors = new HTTPErrors(4000);

			if (!email)
				Errors.AddError({
					Email: {
						Code: 'EmailRequired',
						Message: 'Email is required',
					},
				});

			res.status(400).json(Errors.toJSON());

			return;
		}

		const User = await UserSchema.findOne({
			Email: Encryption.encrypt(email),
		});

		if (!User) {
			const Errors = new HTTPErrors(4001);

			Errors.AddError({
				Email: {
					Code: 'EmailNotFound',
					Message: 'Email not found',
				},
			});

			res.status(400).json(Errors.toJSON());

			return;
		}
	},
);
