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

import type { NextFunction, Request, Response } from 'express';
import type { UserMiddleware } from '../Types/Routes';
import type { LessUser, PopulatedUserWJ } from '../Types/Users/Users';
import FlagFields from '../Utils/Classes/BitFields/Flags.js';
import Encryption from '../Utils/Classes/Encryption.js';
import ErrorGen from '../Utils/Classes/ErrorGen.js';
import Utils from '../Utils/Classes/MiscUtils/Utils.js';
import Token from '../Utils/Classes/Token.js';
import schemaData from '../Utils/SchemaData.js';
import { SettingSchema } from '../Utils/Schemas/Schemas.js';

/**
 * The Middleware on each and every request (well it should be on it)
 * Manages everything user related to what type of user can access (bot or normal user)
 * and what flags are needed/allowed to access the endpoint, As well as if they need to be
 * logged in or not
 */

const User = (options: UserMiddleware) => {
	return async (Req: Request, Res: Response, next: NextFunction) => {
		let AuthHeader = Req.headers.authorization;

		const UnAuthorized = ErrorGen.UnAuthorized();

		if (
			(AuthHeader?.includes('Bot') && options.AllowedRequesters === 'User') ||
			(!AuthHeader?.includes('Bot') && options.AllowedRequesters === 'Bot')
		) {
			UnAuthorized.AddError({
				User: {
					Code: 'InvalidUserType',
					Message: 'You are not allowed to access this endpoint.',
				}
			});

			Res.status(401).json(UnAuthorized.toJSON());

			return;
		}

		AuthHeader = AuthHeader?.split(' ').length === 2 ? AuthHeader.split(' ')[1] : AuthHeader;

		if (options.AccessType === 'LoggedIn' && !AuthHeader) {
			UnAuthorized.AddError({
				User: {
					Code: 'NotLoggedIn',
					Message: 'You need to be logged in to access this endpoint',
				}
			});

			Res.status(401).json(UnAuthorized.toJSON());

			return;
		}

		if (options.AccessType === 'LoggedOut' && AuthHeader) {
			UnAuthorized.AddError({
				User: {
					Code: 'LoggedIn',
					Message: 'You are not allowed to access this endpoint.',
				}
			});

			Res.status(401).json(UnAuthorized.toJSON());

			return;
		}

		if (options.AccessType === 'LoggedIn' && AuthHeader) {
			const VaildatedToken = Token.ValidateToken(AuthHeader);

			if (!VaildatedToken) {
				UnAuthorized.AddError({
					User: {
						Code: 'InvalidToken',
						Message: 'Unauthorized',
					}
				});

				Res.status(401).json(UnAuthorized.toJSON());

				return;
			}

			const DecodedToken = Token.DecodeToken(AuthHeader);

			// user id, and the token are indexed
			const UsersSettings = await SettingSchema.findOne({
				User: Encryption.encrypt(DecodedToken.Snowflake),
				'Tokens.Token': Encryption.encrypt(AuthHeader),
			}).populate<{
				User: PopulatedUserWJ;
			}>('User');

			if (!UsersSettings) {
				UnAuthorized.AddError({
					User: {
						Code: 'InvalidToken',
						Message: 'Unauthorized',
					}
				});

				Res.status(401).json(UnAuthorized.toJSON());

				return;
			}

			if (!UsersSettings.User) {
				UnAuthorized.AddError({
					User: {
						Code: 'InvalidToken',
						Message: 'Unauthorized',
					}
				});

				Res.status(401).json(UnAuthorized.toJSON());

				return;
			}

			const UserFlags = new FlagFields(UsersSettings.User.Flags);

			if (UserFlags.hasString('AccountDeleted') || UserFlags.hasString('WaitingOnDisableDataUpdate') || UserFlags.hasString('WaitingOnAccountDeletion')) {
				const Error = ErrorGen.AccountNotAvailable();

				Error.AddError({
					Email: {
						Code: 'AccountDeleted',
						Message: 'The Account has been deleted',
					}
				});

				Res.send(Error.toJSON());

				return;
			}

			if (UserFlags.hasString('Terminated') || UserFlags.hasString('Disabled')) {
				const Error = ErrorGen.AccountNotAvailable();

				Error.AddError({
					Email: {
						Code: 'AccountDisabled',
						Message: 'The Account has been disabled',
					}
				});

				Res.send(Error.toJSON());

				return;
			}


			if (
				options.AllowedRequesters === 'User' &&
				(UserFlags.hasString('Bot') || UserFlags.hasString('VerifiedBot'))
			) {
				UnAuthorized.AddError({
					User: {
						Code: 'InvalidToken',
						Message: 'Unauthorized',
					}
				});

				Res.status(401).json(UnAuthorized.toJSON());

				return;
			}

			if (
				options.AllowedRequesters === 'Bot' &&
				!(UserFlags.hasString('Bot') || UserFlags.hasString('VerifiedBot'))
			) {
				// res.status(401).json({
				// 	Code: 4_011,
				// 	Message: 'You are not allowed to access this endpoint.',
				// });

				UnAuthorized.AddError({
					User: {
						Code: 'InvalidToken',
						Message: 'Unauthorized',
					}
				});

				Res.status(401).json(UnAuthorized.toJSON());

				return;
			}

			if (options.Flags && options.Flags.length > 0) {
				for (const Flag of options.Flags) {
					if (!UserFlags.hasString(Flag)) {
						UnAuthorized.AddError({
							User: {
								Code: 'InvalidToken',
								Message: 'Unauthorized',
							}
						});

						Res.status(401).json(UnAuthorized.toJSON());

						return;
					}
				}
			}

			if (options.DisallowedFlags && options.DisallowedFlags.length > 0) {
				for (const Flag of options.DisallowedFlags) {
					if (UserFlags.hasString(Flag)) {
						UnAuthorized.AddError({
							User: {
								Code: 'InvalidToken',
								Message: 'Unauthorized',
							}
						});

						Res.status(401).json(UnAuthorized.toJSON());

						return;
					}
				}
			}

			const CompleteDecrypted = Encryption.completeDecryption(UsersSettings.User.toJSON());

			const SchemaUserd = schemaData('RawUser', CompleteDecrypted);

			Req.user = {
				...SchemaUserd,
				Token: AuthHeader,
				Bot: false,
				FlagsUtil: new FlagFields(SchemaUserd.Flags),
			} as LessUser;

			Req.mutils = new Utils(Req.user.Token, Req, Res);

			next();

			return;
		}

		next();
	};
};

export default User;

export { User };
