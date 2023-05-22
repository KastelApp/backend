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
import { hashSync } from 'bcrypt';
import { Config } from '../../Config.js';
import Constants from '../../Constants.js';
import Captcha from '../../Middleware/Captcha.js';
import User from '../../Middleware/User.js';
import EMailTemplate from '../../Utils/Classes/EmailTemplate.js';
import Encryption from '../../Utils/Classes/Encryption.js';
import Token from '../../Utils/Classes/Token.js';
import { SettingSchema, UserSchema } from '../../Utils/Schemas/Schemas.js';
import TagGenerator from '../../Utils/TagGenerator.js';

new Route(
	'/register',
	'POST',
	[
		User({
			AccessType: 'LoggedOut',
			AllowedRequesters: 'User',
		}),
		Captcha({
			Enabled: Constants.Settings.Captcha.Register,
		}),
	],
	async (req, res) => {

		const { username, email, password }: { email: string; invite?: string; password: string; username: string } =
			req.body;

		if (!email || !password || !username) {
			const Errors = new HTTPErrors(4_007);

			if (!email)
				Errors.AddError({
					Email: { Code: 'EmailInvalid', Message: 'The provided email is invalid, missing or already in use' },
				});

			if (!password)
				Errors.AddError({
					password: {
						Code: 'PasswordInvalid',
						Message: 'Password is invalid or missing',
					},
				});

			if (!username)
				Errors.AddError({
					username: {
						Code: 'UsernameInvalid',
						Message: 'Username is invalid or missing',
					},
				});

			res.status(400).json(Errors.toJSON());

			return;
		}

		const UsersCache =
			(await req.app.cache.get(`fullusers:${Encryption.encrypt(email)}`)) ||
			(await UserSchema.findOne({ Email: Encryption.encrypt(email) }));
		const AllUsers = await UserSchema.find({
			Username: Encryption.encrypt(username),
		});

		if (UsersCache || AllUsers.length >= Constants.Settings.Max.UsernameCount) {
			const Errors = new HTTPErrors(4_008);

			if (UsersCache)
				Errors.AddError({
					Email: { Code: 'AlreadyRegistered', Message: 'An account with this email is already registered' },
				});

			if (AllUsers.length >= Constants.Settings.Max.UsernameCount)
				Errors.AddError({
					Username: { Code: 'UsernameTaken', Message: 'Username is taken' },
				});

			if (Object.keys(Errors.Errors).length === 0) {
				Errors.AddError({ Unknown: { Code: 'Unknown', Message: 'Unknown error (1)' } });

				res.status(500).json(Errors.toJSON());

				return;
			}

			res.status(400).json(Errors.toJSON());

			return;
		}

		const PasswordRegex = new RegExp(Config.Regexs.Password);
		const EmailRegex = new RegExp(Config.Regexs.Email);
		const InvalidStuff = new HTTPErrors(4_009);

		if (!PasswordRegex.test(password)) {
			InvalidStuff.AddError({ Password: { Code: 'PasswordInvalid', Message: 'Password is invalid or missing' } });
		}

		if (!EmailRegex.test(email)) {
			InvalidStuff.AddError({
				Email: { Code: 'EmailInvalid', Message: 'The provided email is invalid, missing or already in use' },
			});
		}

		for (const check of Constants.Settings.DisallowedWords.Username) {
			if (
				(typeof check === 'string' && username.toLowerCase().includes(check.toLowerCase())) ||
				(check instanceof RegExp && check.test(username))
			) {
				InvalidStuff.AddError({ Username: { Code: 'UsernameInvalid', Message: 'Username is invalid or missing' } });
				break;
			}
		}

		if (Object.keys(InvalidStuff.Errors).length > 0) {
			res.status(400).json(InvalidStuff.toJSON());
			
			return;
		}

		const GeneratedTag = TagGenerator(AllUsers.map((User) => User.Tag));

		const User = new UserSchema({
			_id: Encryption.encrypt(req.app.snowflake.Generate()),
			Email: Encryption.encrypt(email),
			EmailVerified: false,
			Username: Encryption.encrypt(username),
			Tag: GeneratedTag,
			AvatarHash: null,
			Password: hashSync(password, 10),
			PhoneNumber: null,
			TwoFa: false,
			TwoFaSecret: null,
			TwoFaVerified: false,
			Ips: [],
			Flags: 0,
			Guilds: [],
			Dms: [],
			GroupChats: [],
			Bots: [],
			Banned: false,
			BanReason: null,
			Locked: false,
			AccountDeletionInProgress: false,
		});

		await User.save();

		const UserToken = Token.GenerateToken(Encryption.decrypt(User._id));

		const Settings = new SettingSchema({
			User: User._id,
			Tokens: [
				{
					Token: Encryption.encrypt(UserToken),
					Ip: Encryption.encrypt(req.ip),
					CreatedDate: Date.now(),
				},
			],
		});

		await Settings.save();

		res.status(200).json({
			Token: UserToken,
			User: {
				Id: Encryption.decrypt(User._id),
				Username: username,
				Tag: User.Tag,
				Avatar: null,
				Flags: 0,
				Email: email,
			},
		});

		if (req.NoReply) {
			const { Code } = await req.utils.VerificationLink(
				Constants.VerificationFlags.VerifyEmail,
				Encryption.decrypt(User._id),
			);

			await req.NoReply.SendEmail(
				email,
				'Email Verification',
				undefined,
				await EMailTemplate.EmailVerification(
					username,
					`${Config.Server.Secure ? 'https' : 'http'}://${Config.Server.Domain}/verify/${Code}`,
				),
			);
		}
	},
);
