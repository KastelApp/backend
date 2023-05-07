/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

import { Route } from '@kastelll/core';
import { HTTPErrors } from '@kastelll/util';
import { compareSync } from 'bcrypt';
import Constants from '../../../../Constants.js';
import User from '../../../../Middleware/User.js';
import Encryption from '../../../../Utils/Classes/Encryption.js';
import { SettingSchema, UserSchema } from '../../../../Utils/Schemas/Schemas.js';

interface DisableBody {
	password: string;
}

new Route(
	'/disable',
	'PUT',
	[
		User({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'All',
			Flags: [],
		}),
	],
	async (req, res) => {
		const { password } = req.body as DisableBody;

		if (!password) {
			const Errors = new HTTPErrors(4_013);

			Errors.AddError({
				Password: {
					Code: 'MissingPassword',
					Message: 'You must provide your password to disable your account',
				},
			});

			res.status(400).json(Errors.toJSON());

			return;
		}

		const FoundUser = await UserSchema.findById(Encryption.encrypt(req.user.Id));

		if (!compareSync(password, FoundUser?.Password as string)) {
			const Errors = new HTTPErrors(4_006);

			Errors.AddError({
				Password: {
					Code: 'PasswordIncorrect',
					Message: 'Password is incorrect',
				},
			});

			res.status(400).json(Errors.toJSON());

			return;
		}

		await FoundUser?.updateOne({
			$set: {
				Locked: true,
				Flags: (FoundUser?.Flags as number) | Number(Constants.Flags.WaitingOnDisableDataUpdate),
			},
		});

		const UsersSettings = await SettingSchema.findOne({
			User: Encryption.encrypt(req.user.Id),
		});

		if (UsersSettings) {
			await UsersSettings.updateOne({
				$set: {
					Tokens: [],
				},
			});
		}

		res.status(200).json({
			Success: true,
			Message: 'Account disabled',
		});
	},
);
