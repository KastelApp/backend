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
import type { NextFunction, Request, Response } from 'express';
import type { UserMiddleware } from '../Types/Routes';
import type { LessUser, PopulatedUserWJ } from '../Types/Users/Users';
import FlagFields from '../Utils/Classes/BitFields/Flags.js';
import Encryption from '../Utils/Classes/Encryption.js';
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
	return async (req: Request, res: Response, next: NextFunction) => {
		let AuthHeader = req.headers.authorization;

		if (
			(AuthHeader?.includes('Bot') && options.AllowedRequesters === 'User') ||
			(!AuthHeader?.includes('Bot') && options.AllowedRequesters === 'Bot')
		) {
			res.status(401).json({
				Code: 4_011,
				Message: 'You are not allowed to access this endpoint.',
			});

			return;
		}

		AuthHeader = AuthHeader?.split(' ').length === 2 ? AuthHeader.split(' ')[1] : AuthHeader;

		if (options.AccessType === 'LoggedIn' && !AuthHeader) {
			res.status(401).json({
				Code: 4_010,
				Message: 'You need to be logged in to access this endpoint',
			});

			return;
		}

		if (options.AccessType === 'LoggedOut' && AuthHeader) {
			res.status(401).json({
				Code: 4_011,
				Message: 'You are not allowed to access this endpoint.',
			});

			return;
		}

		if (options.AccessType === 'LoggedIn' && AuthHeader) {
			const VaildatedToken = Token.ValidateToken(AuthHeader);

			if (!VaildatedToken) {
				res.status(401).json({
					Code: 4_012,
					Message: 'Unauthorized',
				});

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
				res.status(401).json({
					Code: 4_012,
					Message: 'Unauthorized',
				});

				return;
			}

			if (!UsersSettings.User) {
				res.status(401).json({
					Code: 4_012,
					Message: 'Unauthorized',
				});

				return;
			}

			const UsersFlags = new FlagFields(UsersSettings.User.Flags);

			if (UsersSettings.User.Banned) {
				const Errors = new HTTPErrors(4_002);

				Errors.AddError({
					Email: {
						Code: 'AccountTerminated',
						Message: 'Your account has been terminated.',
						Reason: UsersSettings.User.BanReason,
					},
				});

				res.status(400).json(Errors.toJSON());

				return;
			}

			if (UsersSettings.User.Locked) {
				const Errors = new HTTPErrors(4_003);

				Errors.AddError({
					Email: {
						Code: 'AccountDisabled',
						Message: 'Your account is disabled, please contact support!',
					},
				});

				res.status(400).json(Errors.toJSON());

				return;
			}

			if (UsersSettings.User.AccountDeletionInProgress) {
				const Errors = new HTTPErrors(4_004);

				Errors.AddError({
					Email: {
						Code: 'AccountDeletionInProgress',
						Message:
							'Your account is currently being deleted, If you would like to cancel this, please contact support',
					},
				});

				res.status(400).json(Errors.toJSON());

				return;
			}

			// if (
			//   !UsersSettings.User.Tokens.find(
			//     (Token) => Token.Token === Encryption.encrypt(AuthHeader as string)
			//   )
			// ) {
			//   res.status(401).json({
			//     Code: 4012,
			//     Message: "Unauthorized",
			//   });

			//   return;
			// }

			if (
				options.AllowedRequesters === 'User' &&
				(UsersFlags.hasString('Bot') || UsersFlags.hasString('VerifiedBot'))
			) {
				res.status(401).json({
					Code: 4_011,
					Message: 'You are not allowed to access this endpoint.',
				});

				return;
			}

			if (
				options.AllowedRequesters === 'Bot' &&
				!(UsersFlags.hasString('Bot') || UsersFlags.hasString('VerifiedBot'))
			) {
				res.status(401).json({
					Code: 4_011,
					Message: 'You are not allowed to access this endpoint.',
				});

				return;
			}

			if (options.Flags && options.Flags.length > 0) {
				for (const Flag of options.Flags) {
					if (!UsersFlags.hasString(Flag)) {
						res.status(401).json({
							Code: 4_011,
							Message: 'You are not allowed to access this endpoint.',
						});

						return;
					}
				}
			}

			if (options.DisallowedFlags && options.DisallowedFlags.length > 0) {
				for (const Flag of options.DisallowedFlags) {
					if (UsersFlags.hasString(Flag)) {
						res.status(401).json({
							Code: 4_011,
							Message: 'You are not allowed to access this endpoint.',
						});

						return;
					}
				}
			}

			const CompleteDecrypted = Encryption.completeDecryption(UsersSettings.User.toJSON());

			const SchemaUserd = schemaData('RawUser', CompleteDecrypted);

			req.user = {
				...SchemaUserd,
				Token: AuthHeader,
				Bot: false,
				FlagsUtil: new FlagFields(SchemaUserd.Flags),
			} as LessUser;

			req.mutils = new Utils(req.user.Token, req, res);

			next();

			return;
		}

		next();
	};
};

export default User;

export { User };
