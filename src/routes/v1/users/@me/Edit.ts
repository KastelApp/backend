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

import { HTTPErrors } from '@kastelll/util';
import { Route } from '@kastelll/core';
import { compareSync, hashSync } from 'bcrypt';
import Constants from '../../../../Constants';
import Captcha from '../../../../Middleware/Captcha';
import User from '../../../../Middleware/User';
import type { PopulatedUserWJ, UserAtMe } from '../../../../Types/Users/Users';
import FlagFields from '../../../../Utils/Classes/BitFields/Flags';
import Encryption from '../../../../Utils/Classes/Encryption';
import schemaData from '../../../../Utils/SchemaData';
import { UserSchema } from '../../../../Utils/Schemas/Schemas';

interface EditUserBody {
	username?: string;
	tag?: string;
	email?: string;
	password?: string;
	avatar?: string;
	phoneNumber?: string;
	twoFa?: boolean;
	twoFaSecret?: string;
	newPassword?: string;
	twoFaCode?: string;
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
		Captcha({
			Enabled: Constants.Settings.Captcha.ChangePassword || Constants.Settings.Captcha.ChangeEmail,
			BodyTrigger: [
				...(Constants.Settings.Captcha.ChangePassword ? ['password'] : []),
				...(Constants.Settings.Captcha.ChangeEmail ? ['email'] : []),
			],
		}),
	],
	async (req, res) => {
		const {
			// avatar, // base64 if the avatar, We send it to the CDN after
			email,
			password,
			phoneNumber,
			tag,
			twoFa,
			username,
			newPassword,
		} = req.body as EditUserBody;

		if (tag && tag === '0000') {
			const Errors = new HTTPErrors(4014);

			Errors.AddError({
				Tag: {
					Code: 'InvalidTag',
					Message: 'You cannot use a tag of 0000',
				},
			});

			res.status(401).json(Errors.toJSON());

			return;
		}

		if (password || twoFa || phoneNumber) {
			if (req.user.Bot) {
				const Errors = new HTTPErrors(4013);

				if (password)
					Errors.AddError({
						Password: {
							Code: 'CannotChangePassword',
							Message: 'You cannot change your password as a bot',
						},
					});

				if (twoFa)
					Errors.AddError({
						TwoFa: {
							Code: 'CannotChangeTwoFa',
							Message: 'You cannot change your two factor authentication as a bot',
						},
					});

				if (phoneNumber)
					Errors.AddError({
						PhoneNumber: {
							Code: 'CannotChangePhoneNumber',
							Message: 'You cannot change your phone number as a bot',
						},
					});

				res.status(401).json(Errors.toJSON());

				return;
			}
		}

		if (phoneNumber || email || twoFa || newPassword) {
			if (!password) {
				const Errors = new HTTPErrors(4013);

				if (phoneNumber)
					Errors.AddError({
						PhoneNumber: {
							Code: 'CannotChangePhoneNumber',
							Message: 'You cannot change your phone number without providing your password',
						},
					});

				if (email)
					Errors.AddError({
						email: {
							Code: 'CannotChangeEmail',
							Message: 'You cannot change your email without providing your password',
						},
					});

				if (twoFa)
					Errors.AddError({
						twoFa: {
							Code: 'CannotChangeTwoFa',
							Message: 'You cannot change your two factor authentication without providing your password',
						},
					});

				if (newPassword)
					Errors.AddError({
						newPassword: {
							Code: 'CannotChangeNewPassword',
							Message: 'You cannot change your new password without providing your password',
						},
					});

				res.status(401).json(Errors.toJSON());

				return;
			}
		}

		const FoundUser = await UserSchema.findById(Encryption.encrypt(req.user.Id));

		if (phoneNumber || email || twoFa || newPassword) {
			if (!compareSync(password as string, FoundUser?.Password as string)) {
				const Errors = new HTTPErrors(4006);

				Errors.AddError({
					password: {
						Code: 'PasswordIncorrect',
						Message: 'Password is incorrect',
					},
				});

				res.status(400).json(Errors.toJSON());

				return;
			}
		}

		await FoundUser?.updateOne({
			$set: {
				Username: username ? Encryption.encrypt(username) : FoundUser.Username,
				Tag: tag ? tag : FoundUser.Tag,
				Email: email ? Encryption.encrypt(email) : FoundUser.Email,
				Password: newPassword ? hashSync(newPassword, 10) : FoundUser.Password,
				// AvatarHash: avatar ? avatar : FoundUser.AvatarHash,
				PhoneNumber: phoneNumber ? Encryption.encrypt(phoneNumber) : FoundUser.PhoneNumber,
				EmailVerified: FoundUser.EmailVerified ?? false,
				TwoFa: twoFa ? twoFa : FoundUser.TwoFa,
				TwoFaSecret: twoFa ? null : FoundUser.TwoFaSecret,
			},
		});

		const ChangedUser = {
			...(FoundUser?.toJSON() as PopulatedUserWJ),
			Username: username ? Encryption.encrypt(username) : FoundUser?.Username,
			Tag: tag ? tag : FoundUser?.Tag,
			Email: email ? Encryption.encrypt(email) : FoundUser?.Email,
			Password: newPassword ? hashSync(newPassword, 10) : FoundUser?.Password,
			// AvatarHash: avatar ? avatar : FoundUser?.AvatarHash,
			PhoneNumber: phoneNumber ? Encryption.encrypt(phoneNumber) : FoundUser?.PhoneNumber,
			EmailVerified: FoundUser?.EmailVerified ?? false,
			TwoFa: twoFa ? twoFa : FoundUser?.TwoFa,
			TwoFaSecret: twoFa ? null : FoundUser?.TwoFaSecret,
			id: Encryption.decrypt(FoundUser?.id as string),
		} as PopulatedUserWJ;

		const SchemaUser = schemaData('User', Encryption.completeDecryption(ChangedUser)) as UserAtMe;

		SchemaUser.PublicFlags = Number(FlagFields.RemovePrivateFlags(BigInt(SchemaUser.PublicFlags)));

		res.status(200).json(SchemaUser);
	},
);
