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

import { compareSync } from 'bcrypt';
import type { Request, Response } from 'express';
import Constants from '../../Constants.js';
import Captcha from '../../Middleware/Captcha.js';
import User from '../../Middleware/User.js';
import type App from '../../Utils/Classes/App';
import FlagFields from '../../Utils/Classes/BitFields/Flags.js';
import Encryption from '../../Utils/Classes/Encryption.js';
import ErrorGen from '../../Utils/Classes/ErrorGen.js';
import Route from '../../Utils/Classes/Route.js';
import Token from '../../Utils/Classes/Token.js';
import type { User as UserType } from '../../Utils/Cql/Types/index.js';

interface LoginBody {
	Email: string;
	Password: string;
}

export default class Login extends Route {
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

		this.Routes = ['/login'];
	}

	public override async Request(Req: Request<any, any, LoginBody>, Res: Response) {
		const { Email, Password } = Req.body;

		if (!Email || !Password) {
			const Error = ErrorGen.MissingAuthField();

			if (!Email) {
				Error.AddError({
					Email: {
						Code: 'InvalidEmail',
						Message: 'The Email provided is Invalid, Missing or already in use',
					},
				});
			}

			if (!Password) {
				Error.AddError({
					Password: {
						Code: 'InvalidPassword',
						Message: 'The Password provided is Invalid, or Missing',
					},
				});
			}

			Res.status(400).send(Error.toJSON());

			return;
		}

		const FetchedUser = await this.FetchUser(undefined, Email);

		if (!FetchedUser) {
			const Error = ErrorGen.MissingAuthField();

			Error.AddError({
				Email: {
					Code: 'InvalidEmail',
					Message: 'The Email provided is Invalid, Missing or already in use',
				},
			});

			Res.status(401).send(Error.toJSON());

			return;
		}

		if (!compareSync(Password, FetchedUser.Password)) {
			const Error = ErrorGen.InvalidCredentials();

			Error.AddError({
				Password: {
					Code: 'InvalidPassword',
					Message: 'The Password provided is Invalid, or Missing',
				},
			});

			Res.status(401).send(Error.toJSON());

			return;
		}

		const UserFlags = new FlagFields(FetchedUser.Flags, FetchedUser.PublicFlags);

		if (
			UserFlags.has('AccountDeleted') ||
			UserFlags.has('WaitingOnDisableDataUpdate') ||
			UserFlags.has('WaitingOnAccountDeletion')
		) {
			const Error = ErrorGen.AccountNotAvailable();

			Error.AddError({
				Email: {
					Code: 'AccountDeleted',
					Message: 'The Account has been deleted',
				},
			});

			Res.status(401).send(Error.toJSON());

			return;
		}

		if (UserFlags.has('Terminated') || UserFlags.has('Disabled')) {
			const Error = ErrorGen.AccountNotAvailable();

			Error.AddError({
				Email: {
					Code: 'AccountDisabled',
					Message: 'The Account has been disabled',
				},
			});

			Res.status(401).send(Error.toJSON());

			return;
		}

		const NewToken = Token.GenerateToken(FetchedUser.UserId);

		const Tokens = await this.App.Cassandra.Models.Settings.get({
			UserId: Encryption.Encrypt(FetchedUser.UserId)
		}, { fields: ['tokens'] });

		const SessionId = Encryption.Encrypt(this.App.Snowflake.Generate());

		if (!Tokens) {
			Res.status(500).send('Internal Server Error :(');

			return;
		}

		const NewTokens = Tokens.Tokens ? Tokens.Tokens : [];

		NewTokens.push({
			TokenId: SessionId,
			Token: Encryption.Encrypt(NewToken),
			CreatedDate: new Date(),
			Ip: Encryption.Encrypt(Req.ip),
			Flags: 0,
		});

		await this.App.Cassandra.Models.Settings.update({
			UserId: Encryption.Encrypt(FetchedUser.UserId),
			Tokens: NewTokens
		});

		this.App.SystemSocket.Events.NewSession({
			UserId: FetchedUser.UserId,
			SessionId: Encryption.Decrypt(SessionId),
		});

		Res.send({
			Token: NewToken,
		});
	}

	private async FetchUser(UserId?: string, Email?: string): Promise<UserType | null> {
		const FetchedUser = await this.App.Cassandra.Models.User.get({
			...(UserId ? { UserId: Encryption.Encrypt(UserId) } : {}),
			...(Email ? { Email: Encryption.Encrypt(Email) } : {}),
		});

		if (!FetchedUser) return null;

		return Encryption.CompleteDecryption({
			...FetchedUser,
			Flags: FetchedUser?.Flags ? String(FetchedUser.Flags) : '0',
		});
	}
}
