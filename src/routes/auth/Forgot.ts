import { Route } from '@kastelll/core';
import { HTTPErrors } from '@kastelll/util';
import Constants from '../../Constants.js';
import Captcha from '../../Middleware/Captcha.js';
import Encryption from '../../Utils/Classes/Encryption.js';
import { UserSchema } from '../../Utils/Schemas/Schemas.js';

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
			const Errors = new HTTPErrors(4_000);

			// if (!email) // temp until we add more checks
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
			const Errors = new HTTPErrors(4_001);

			Errors.AddError({
				Email: {
					Code: 'EmailNotFound',
					Message: 'Email not found',
				},
			});

			res.status(400).json(Errors.toJSON());
		}
	},
);
