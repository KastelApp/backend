import { Route } from '@kastelll/core';
import Constants from '../../Constants.js';
import Captcha from '../../Middleware/Captcha.js';

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
