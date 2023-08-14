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
import type { ExpressUser } from '../Types';
import type { UserMiddleware } from '../Types/Routes';
import App from '../Utils/Classes/App.js';
import FlagFields from '../Utils/Classes/BitFields/Flags.js';
import Encryption from '../Utils/Classes/Encryption.js';
import ErrorGen from '../Utils/Classes/ErrorGen.js';
import Token from '../Utils/Classes/Token.js';

/**
 * The Middleware on each and every request (well it should be on it)
 * Manages everything user related to what type of user can access (bot or normal user)
 * and what flags are needed/allowed to access the endpoint, As well as if they need to be
 * logged in or not
 */

const User = (options: UserMiddleware) => {
	return async (Req: Request, Res: Response, next: NextFunction) => {

		let AuthHeader = Req.headers.authorization;
		const AuthIsBot = Req.headers.authorization?.toLowerCase()?.includes('bot');

		const UnAuthorized = ErrorGen.UnAuthorized();

		if ((AuthIsBot && options.AllowedRequesters === 'User') || (!AuthIsBot && options.AllowedRequesters === 'Bot')) {
			App.StaticLogger.debug(`Unexpected User Type ${AuthIsBot ? 'Is Bot' : "Isn't Bot"}`);

			UnAuthorized.AddError({
				User: {
					Code: 'InvalidUserType',
					Message: 'You are not allowed to access this endpoint.',
				},
			});

			Res.status(401).json(UnAuthorized.toJSON());

			return;
		}

		AuthHeader = AuthHeader?.split(' ').length === 2 ? AuthHeader.split(' ')[1] : AuthHeader;

		if (options.AccessType === 'LoggedIn' && !AuthHeader) {
			App.StaticLogger.debug("User isn't logged in though it is expected");

			UnAuthorized.AddError({
				User: {
					Code: 'NotLoggedIn',
					Message: 'You need to be logged in to access this endpoint',
				},
			});

			Res.status(401).json(UnAuthorized.toJSON());

			return;
		}

		if (options.AccessType === 'LoggedOut' && AuthHeader) {
			App.StaticLogger.debug('User is logged in though its not expected');

			UnAuthorized.AddError({
				User: {
					Code: 'LoggedIn',
					Message: 'You are not allowed to access this endpoint.',
				},
			});

			Res.status(401).json(UnAuthorized.toJSON());

			return;
		}

		if (options.AccessType === 'LoggedIn' && AuthHeader) {
			const VaildatedToken = Token.ValidateToken(AuthHeader);

			if (!VaildatedToken) {
				App.StaticLogger.debug("Token couldn't be validated");

				UnAuthorized.AddError({
					User: {
						Code: 'InvalidToken',
						Message: 'Unauthorized',
					},
				});

				Res.status(401).json(UnAuthorized.toJSON());

				return;
			}

			const DecodedToken = Token.DecodeToken(AuthHeader);

			const UsersSettings = await options.App.Cassandra.Models.Settings.get({
				UserId: Encryption.encrypt(DecodedToken.Snowflake),
			}, {
				fields: ['tokens']
			});

			const UserData = await options.App.Cassandra.Models.User.get({
				UserId: Encryption.encrypt(DecodedToken.Snowflake),
			}, {
				fields: ['email', 'user_id', 'flags', 'password']
			});

			if (!UsersSettings || !UserData) {
				App.StaticLogger.debug("User settings wasn't found", (DecodedToken.Snowflake));
				App.StaticLogger.debug(UserData, UsersSettings);

				UnAuthorized.AddError({
					User: {
						Code: 'InvalidToken',
						Message: 'Unauthorized',
					},
				});

				Res.status(401).json(UnAuthorized.toJSON());

				return;
			}

			if (!UsersSettings?.Tokens?.some((Token) => Token.Token === Encryption.encrypt(AuthHeader as string))) {
				App.StaticLogger.debug('Token not found in the user settings');

				UnAuthorized.AddError({
					User: {
						Code: 'InvalidToken',
						Message: 'Unauthorized',
					},
				});

				Res.status(401).json(UnAuthorized.toJSON());

				return;
			}

			const UserFlags = new FlagFields(UserData.Flags);

			if (
				UserFlags.hasString('AccountDeleted') ||
				UserFlags.hasString('WaitingOnDisableDataUpdate') ||
				UserFlags.hasString('WaitingOnAccountDeletion')
			) {
				const Error = ErrorGen.AccountNotAvailable();

				App.StaticLogger.debug('Account Is Deleted or about to be deleted');

				Error.AddError({
					Email: {
						Code: 'AccountDeleted',
						Message: 'The Account has been deleted',
					},
				});

				Res.send(Error.toJSON());

				return;
			}

			if (UserFlags.hasString('Terminated') || UserFlags.hasString('Disabled')) {
				const Error = ErrorGen.AccountNotAvailable();

				App.StaticLogger.debug('Account Is Disabled or Terminated');

				Error.AddError({
					Email: {
						Code: 'AccountDisabled',
						Message: 'The Account has been disabled',
					},
				});

				Res.send(Error.toJSON());

				return;
			}

			if (
				(AuthIsBot && (!UserFlags.hasString('Bot') || !UserFlags.hasString('VerifiedBot'))) ||
				(!AuthIsBot && (UserFlags.hasString('Bot') || UserFlags.hasString('VerifiedBot')))
			) {
				App.StaticLogger.debug(
					'The user has a (or is missing) a flag its not meant to (bot) and is using an invalid header tbh idk how to log this well',
					AuthIsBot,
					(!AuthIsBot && UserFlags.hasString('Bot')) || UserFlags.hasString('VerifiedBot'),
					(AuthIsBot && !UserFlags.hasString('Bot')) || !UserFlags.hasString('VerifiedBot'),
				);

				UnAuthorized.AddError({
					User: {
						Code: 'InvalidUserType',
						Message: 'You are not allowed to access this endpoint.',
					},
				});

				Res.status(401).json(UnAuthorized.toJSON());

				return;
			}

			if (options.AllowedRequesters === 'User' && (UserFlags.hasString('Bot') || UserFlags.hasString('VerifiedBot'))) {
				App.StaticLogger.debug('User only endpoint though user is a bot');

				UnAuthorized.AddError({
					User: {
						Code: 'InvalidToken',
						Message: 'Unauthorized',
					},
				});

				Res.status(401).json(UnAuthorized.toJSON());

				return;
			}

			if (options.AllowedRequesters === 'Bot' && !(UserFlags.hasString('Bot') || UserFlags.hasString('VerifiedBot'))) {
				App.StaticLogger.debug('Bot only endpoint though user is not a bot');

				UnAuthorized.AddError({
					User: {
						Code: 'InvalidToken',
						Message: 'Unauthorized',
					},
				});

				Res.status(401).json(UnAuthorized.toJSON());

				return;
			}

			if (options.Flags && options.Flags.length > 0) {
				for (const Flag of options.Flags) {
					if (!UserFlags.hasString(Flag)) {
						App.StaticLogger.debug(`User is missing the ${Flag} flag`);

						UnAuthorized.AddError({
							User: {
								Code: 'InvalidToken',
								Message: 'Unauthorized',
							},
						});

						Res.status(401).json(UnAuthorized.toJSON());

						return;
					}
				}
			}

			if (options.DisallowedFlags && options.DisallowedFlags.length > 0) {
				for (const Flag of options.DisallowedFlags) {
					if (UserFlags.hasString(Flag)) {
						App.StaticLogger.debug(`User has the ${Flag} flag`);

						UnAuthorized.AddError({
							User: {
								Code: 'InvalidToken',
								Message: 'Unauthorized',
							},
						});

						Res.status(401).json(UnAuthorized.toJSON());

						return;
					}
				}
			}

			const CompleteDecrypted: { Email: string, Flags: string, Password: string, UserId: string; } = Encryption.completeDecryption({
				...UserData,
				Flags: UserData.Flags.toString()
			});

			Req.user = {
				Token: AuthHeader,
				Bot: UserFlags.hasString('Bot') || UserFlags.hasString('VerifiedBot'),
				FlagsUtil: UserFlags,
				Email: CompleteDecrypted.Email,
				Id: CompleteDecrypted.UserId,
				Password: CompleteDecrypted.Password,
			} as ExpressUser;

			next();

			return;
		}

		next();
	};
};

export default User;

export { User };
