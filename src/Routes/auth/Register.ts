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

import { hashSync } from 'bcrypt';
import type { Request, Response } from 'express';
import Constants from '../../Constants.js';
import Captcha from '../../Middleware/Captcha.js';
import User from '../../Middleware/User.js';
import type App from '../../Utils/Classes/App';
import Encryption from '../../Utils/Classes/Encryption.js';
import ErrorGen from '../../Utils/Classes/ErrorGen.js';
import Route from '../../Utils/Classes/Route.js';
import Token from '../../Utils/Classes/Token.js';
import type Settings from '../../Utils/Cql/Types/Settings.js';
import type Users from '../../Utils/Cql/Types/User.js';
import type { User as UserType } from '../../Utils/Cql/Types/index.js';
import TagGenerator from '../../Utils/TagGenerator.js';

interface RegisterBody {
	Email: string;
	Invite?: string;
	Password: string;
	Username: string;
}

export default class Register extends Route {
	public constructor(App: App) {
		super(App);

		this.Methods = ['POST'];

		this.Middleware = [
			User({
				AccessType: 'LoggedOut',
				AllowedRequesters: 'User',
				App
			}),
			Captcha({
				Enabled: Constants.Settings.Captcha.Register,
			}),
		];

		this.AllowedContentTypes = ['application/json'];

		this.Routes = ['/register'];
	}

	public override async Request(Req: Request<any, any, RegisterBody>, Res: Response) {
		const { Email, Password, Username } = Req.body;

		const PlusReplace = /\+([^@]+)/g; // eslint-disable-line prefer-named-capture-group
		const PasswordValidtor = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()-=_+{};:<>,.?/~]{6,72}$/; // eslint-disable-line unicorn/better-regex
		const EmailValidator = /^[\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,}$/;
		const UsernameValidator =
			/^(?=.*[a-zA-Z0-9!$%^&*()\-_~>.<?/\s\u0020-\uD7FF\uE000-\uFFFD])[a-zA-Z0-9!$%^&*()\-_~>.<?/\s\u0020-\uD7FF\uE000-\uFFFD]{2,30}$/; // eslint-disable-line unicorn/better-regex

		if (!EmailValidator.test(Email ?? '') || !PasswordValidtor.test(Password ?? '') || !UsernameValidator.test(Username ?? '')) {
			const Error = ErrorGen.MissingAuthField();

			if (!EmailValidator.test(Email ?? '')) {
				Error.AddError({
					Email: {
						Code: 'InvalidEmail',
						Message: 'The Email provided is Invalid, Missing or already in use',
					},
				});
			}

			if (!PasswordValidtor.test(Password ?? '')) {
				Error.AddError({
					Password: {
						Code: 'InvalidPassword',
						Message: 'The Password provided is Invalid, or Missing',
					},
				});
			}

			if (!UsernameValidator.test(Username ?? '')) {
				Error.AddError({
					Username: {
						Code: 'InvalidUsername',
						Message: 'The Username provided is Invalid, or Missing',
					},
				});
			}

			Res.status(400).send(Error.toJSON());

			return;
		}

		const FetchedUsers = await this.FetchUsers(Username, ['username', 'tag']);
		const CleanedEmail = Email.replaceAll(PlusReplace, '');
		const UserExists = await this.FetchUser(CleanedEmail);
		const MaxUsernamesReached = await this.MaxUsernamesReached(undefined, FetchedUsers?.length ?? 0);
		const Failed = ErrorGen.FailedToRegister();

		if (UserExists) {
			Failed.AddError({
				Email: {
					Code: 'InvalidEmail',
					Message: 'The Email provided is Invalid, Missing or already in use',
				},
			});
		}

		if (MaxUsernamesReached) {
			Failed.AddError({
				Username: {
					Code: 'MaxUsernames',
					Message: 'The Username provided is Invalid, or Missing',
				},
			});
		}

		if (Object.keys(Failed.Errors).length > 0) {
			Res.status(401).send(Failed.toJSON());

			return;
		}

		const Tag = await this.GenerateTag(undefined, FetchedUsers ?? []);

		const UserObject: UserType = {
			Avatar: '',
			Email: Encryption.Encrypt(CleanedEmail),
			PublicFlags: '0',
			Flags: '0',
			GlobalNickname: '',
			Guilds: [],
			Ips: [],
			Password: hashSync(Password, 10),
			PhoneNumber: '',
			Tag,
			TwoFaSecret: '',
			UserId: Encryption.Encrypt(this.App.Snowflake.Generate()),
			Username: Encryption.Encrypt(Username),
		};

		const NewToken = Token.GenerateToken(Encryption.Decrypt(UserObject.UserId));

		const SettingsObject: Settings = {
			Language: 'en-US',
			MaxFileUploadSize: Constants.Settings.Max.MaxFileSize,
			MaxGuilds: Constants.Settings.Max.GuildCount,
			Mentions: [],
			Presence: Constants.Presence.Online,
			Privacy: 0,
			Status: '',
			Theme: 'dark',
			Tokens: [{
				CreatedDate: new Date(),
				Flags: 0,
				Ip: Encryption.Encrypt(Req.clientIp),
				Token: Encryption.Encrypt(NewToken),
				TokenId: Encryption.Encrypt(this.App.Snowflake.Generate()),
			}],
			UserId: UserObject.UserId,
			Bio: '',
		};

		await Promise.all([
			this.App.Cassandra.Models.User.insert(UserObject),
			this.App.Cassandra.Models.Settings.insert(SettingsObject)
		]);

		Res.send({
			Token: NewToken,
			User: {
				Id: Encryption.Decrypt(UserObject.UserId),
				Email: CleanedEmail,
				Username,
				Tag,
				Avatar: null,
				PublicFlags: 0,
			},
		});
	}

	// private async FetchInvite(Invite: string): Promise<void> {
	//     if (Invite) {
	//         // waffles
	//     }
	// }

	private async FetchUser(Email: string): Promise<Users | null> {
		const FetchedUser = await this.App.Cassandra.Models.User.get({
			Email: Encryption.Encrypt(Email)
		}, { fields: ['email'] });

		if (!FetchedUser) return null;

		return FetchedUser;
	}

	private async FetchUsers(Username: string, Fields?: string[]): Promise<Users[] | null> {
		const FetchedUsers = await this.App.Cassandra.Models.User.find({
			Username: Encryption.Encrypt(Username)
		}, { fields: Fields ?? [] });

		return FetchedUsers.toArray();
	}

	private async MaxUsernamesReached(Username?: string, Count?: number): Promise<boolean> {
		let FoundCount = 0;

		if (Count) {
			FoundCount = Count;
		} else if (Username) {
			const FoundUsers = await this.App.Cassandra.Execute(
				'SELECT COUNT(1) FROM users WHERE username = ?',
				[Encryption.Encrypt(Username)]
			);

			const Value: number = FoundUsers?.first()?.get('count').toNumber() ?? 0;

			FoundCount = Value;
		}

		return FoundCount >= Constants.Settings.Max.UsernameCount;
	}

	private async GenerateTag(Username?: string, Users?: Users[]): Promise<string> {
		const FoundUsers = Username ? await this.FetchUsers(Username, ['tag']) : Users ? Users : null;

		if (FoundUsers) {
			const Tags = FoundUsers.map((User) => User.Tag);

			return TagGenerator(Tags);
		}

		return TagGenerator([]);
	}
}
