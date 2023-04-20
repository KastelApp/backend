import { Route } from '@kastelll/core';
import Constants from '../../Constants';
import Captcha from '../../Middleware/Captcha';

new Route(
	'/reset',
	'POST',
	[
		Captcha({
			Enabled: Constants.Settings.Captcha.ForgotPassword,
		}),
	],
	async (req, res) => {},
);
