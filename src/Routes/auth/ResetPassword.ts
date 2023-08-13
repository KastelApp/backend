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
import User from '../../Middleware/User.js';
import type App from '../../Utils/Classes/App';
import Encryption from '../../Utils/Classes/Encryption.js';
import ErrorGen from '../../Utils/Classes/ErrorGen.js';
import Route from '../../Utils/Classes/Route.js';
import type { User as UserType } from '../../Utils/Cql/Types/index.js';

interface ResetBody {
	Code: string;
	Email: string;
	NewPassword: string;
}

export default class ResetPassword extends Route {
	public constructor(App: App) {
		super(App);

		this.Methods = ['PATCH'];

		this.Middleware = [
			User({
				AccessType: 'LoggedOut',
				AllowedRequesters: 'User',
				App
			}),
		];

		this.AllowedContentTypes = ['application/json'];

		this.Routes = ['/reset'];
	}

	public override async Request(Req: Request<any, any, ResetBody>, Res: Response) {
		const { Email, NewPassword, Code } = Req.body;

		const PasswordValidtor = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()-=_+{};:<>,.?/~]{6,72}$/; // eslint-disable-line unicorn/better-regex

		this.App.Logger.debug(`[Reset Password] Email: ${Email}, Password: ${NewPassword}, Code: ${Code}`);

		if (!Email || !PasswordValidtor.test(NewPassword) || !Code) {
			const Error = ErrorGen.MissingAuthField();

			if (!Email) {
				Error.AddError({
					Email: {
						Code: 'InvalidEmail',
						Message: 'The Email provided is Invalid, Missing or already in use',
					},
				});
			}

			if (!PasswordValidtor.test(NewPassword)) {
				Error.AddError({
					Password: {
						Code: 'InvalidPassword',
						Message: 'The Password provided is Invalid, or Missing',
					},
				});
			}

			if (!Code) {
				Error.AddError({
					Code: {
						Code: 'InvalidCode',
						Message: 'The Code provided is Invalid, or Missing',
					},
				});
			}

			Res.send(Error.toJSON());

			return;
		}

		const FetchedUser = await this.FetchUser(undefined, Email);

		if (!FetchedUser) {
			const Error = ErrorGen.MissingAuthField();

			this.App.Logger.debug("[Reset Password] Couldn't fetch the user, they do not exist");

			Error.AddError({
				Email: {
					Code: 'InvalidEmail',
					Message: 'The Email provided is Invalid, Missing or already in use',
				},
			});

			Res.send(Error.toJSON());

			return;
		}

		const LinkVerification = await this.App.Cassandra.Models.VerificationLink.get({
			Code: Encryption.encrypt(Code),
		});
		
		if (!LinkVerification) {
			const Error = ErrorGen.MissingAuthField();

			this.App.Logger.debug("[Reset Password] Couldn't find the Code");
			this.App.Logger.debug(`[Reset Password] ${Encryption.encrypt(Code)}`);

			Error.AddError({
				Code: {
					Code: 'InvalidCode',
					Message: 'The Code provided is Invalid, or Missing',
				},
			});

			Res.send(Error.toJSON());

			return;
		}
		
		if (LinkVerification.Flags !== this.App.Constants.VerificationFlags.ForgotPassword) {
			const Error = ErrorGen.MissingAuthField();

			this.App.Logger.debug("[Reset Password] Code is not a Forgot Password code");

			Error.AddError({
				Code: {
					Code: 'InvalidCode',
					Message: 'The Code provided is Invalid, or Missing',
				},
			});

			Res.send(Error.toJSON());

			return;
		}

		if (Date.now() >= LinkVerification.ExpireDate.getTime()) {
			const Error = ErrorGen.MissingAuthField();

			this.App.Logger.debug('[Reset Password] Code is expired :/');

			Error.AddError({
				Code: {
					Code: 'InvalidCode',
					Message: 'The code provided is Invalid, or Missing',
				},
			});

			Res.send(Error.toJSON());

			return;
		}
		
		await this.App.Cassandra.Models.User.update({
			UserId: Encryption.encrypt(FetchedUser.UserId),
			Password: hashSync(NewPassword, 10),
		})

		await this.App.Cassandra.Models.Settings.update({
			UserId: Encryption.encrypt(FetchedUser.UserId),
			Tokens: [],
		});
		
		await this.App.Cassandra.Models.VerificationLink.remove({
			Code: Encryption.encrypt(Code)
		})

		Res.status(204).end();
	}

	private async FetchUser(UserId?: string, Email?: string): Promise<UserType | null> {
		const FetchedUser = await this.App.Cassandra.Models.User.get({
			...(UserId ? { UserId: Encryption.encrypt(UserId) } : {}),
			...(Email ? { Email: Encryption.encrypt(Email) } : {}),
		});

		if (!FetchedUser) return null;

		return Encryption.completeDecryption({
			...FetchedUser,
			Flags: FetchedUser?.Flags ? String(FetchedUser.Flags) : '0',
		});
	}
}
