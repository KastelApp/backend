import type { UserMiddleware } from "@/Types/Routes.ts";
import FlagFields from "@/Utils/Classes/BitFields/Flags.ts";
import Encryption from "@/Utils/Classes/Encryption.ts";
import errorGen from "@/Utils/Classes/ErrorGen.ts";
import type { CreateMiddleware, CreateRoute } from "@/Utils/Classes/Routing/Route.ts";
import Token from "@/Utils/Classes/Token.ts";

export interface UserMiddlewareType extends Record<string, any> {
	user: {
		Bot: boolean;
		Email: string;
		FlagsUtil: FlagFields;
		Guilds: string[];
		Id: string;
		Password: string;
		Token: string;
	};
}

const userMiddleware = (options: UserMiddleware) => {
	return async ({
		headers,
		set,
		app,
	}: CreateRoute<string, {}>): Promise<CreateMiddleware<Record<string, unknown> | UserMiddlewareType | string>> => {
		let authHeader = headers.authorization;
		const isBot = headers.authorization?.toLowerCase()?.startsWith("bot ") ?? false;

		const unAuthorizedError = errorGen.UnAuthorized();

		if ((isBot && options.AllowedRequesters === "User") || (!isBot && options.AllowedRequesters === "Bot")) {
			app.Logger.debug(`Unexpected User Type ${isBot ? "Is Bot" : "Isn't Bot"}`);

			unAuthorizedError.AddError({
				user: {
					code: "InvalidUserType",
					message: "You are not allowed to access this endpoint.",
				},
			});

			set.status = 401;

			return unAuthorizedError.toJSON();
		}

		authHeader = authHeader?.split(" ").length === 2 ? authHeader.split(" ")[1] : authHeader;

		if (options.AccessType === "LoggedIn" && !authHeader) {
			app.Logger.debug("User isn't logged in though it is expected");

			unAuthorizedError.AddError({
				user: {
					code: "NotLoggedIn",
					message: "You need to be logged in to access this endpoint",
				},
			});

			set.status = 401;

			return unAuthorizedError.toJSON();
		}

		if (options.AccessType === "LoggedOut" && authHeader) {
			app.Logger.debug("User is logged in though its not expected");

			unAuthorizedError.AddError({
				user: {
					code: "LoggedIn",
					message: "You are not allowed to access this endpoint.",
				},
			});

			set.status = 401;

			return unAuthorizedError.toJSON();
		}

		if (options.AccessType === "LoggedIn" && authHeader) {
			const vaildatedToken = Token.ValidateToken(authHeader);

			if (!vaildatedToken) {
				app.Logger.debug("Token couldn't be validated");

				unAuthorizedError.AddError({
					user: {
						code: "InvalidToken",
						message: "Unauthorized",
					},
				});

				set.status = 401;

				return unAuthorizedError.toJSON();
			}

			const decodedToken = Token.DecodeToken(authHeader);

			const usersSettings = await app.Cassandra.Models.Settings.get(
				{
					userId: Encryption.Encrypt(decodedToken.Snowflake),
				},
				{
					fields: ["tokens", "max_file_upload_size"],
				},
			);

			const userData = await app.Cassandra.Models.User.get(
				{
					userId: Encryption.Encrypt(decodedToken.Snowflake),
				},
				{
					fields: ["email", "user_id", "flags", "password", "public_flags", "guilds"],
				},
			);

			if (!usersSettings || !userData) {
				app.Logger.debug("User settings wasn't found", decodedToken.Snowflake);
				app.Logger.debug(userData, usersSettings);

				unAuthorizedError.AddError({
					user: {
						code: "InvalidToken",
						message: "Unauthorized",
					},
				});

				if (!usersSettings || !userData) {
					// darkerink: just in case there is one but not the other (has happened in very rare cases) contacting support will be the only way to fix this (for now);
					// Res.status(500).send("Internal Server Error :(");

					set.status = 500;

					return "Internal Server Error :(";
				} else {
					set.status = 401;

					return unAuthorizedError.toJSON();
				}
			}

			if (!usersSettings?.tokens?.some((Token) => Token.token === Encryption.Encrypt(authHeader as string))) {
				app.Logger.debug("Token not found in the user settings");

				unAuthorizedError.AddError({
					user: {
						code: "InvalidToken",
						message: "Unauthorized",
					},
				});

				// Res.status(401).json(UnAuthorized.toJSON());

				set.status = 401;

				return unAuthorizedError.toJSON();
			}

			const userFlags = new FlagFields(userData.flags, userData.publicFlags);
			const accountNotAvailableError = errorGen.AccountNotAvailable();

			if (
				userFlags.PrivateFlags.has("AccountDeleted") ||
				userFlags.PrivateFlags.has("WaitingOnDisableDataUpdate") ||
				userFlags.PrivateFlags.has("WaitingOnAccountDeletion")
			) {
				app.Logger.debug("Account Is Deleted or about to be deleted");

				accountNotAvailableError.AddError({
					email: {
						code: "AccountDeleted",
						message: "The Account has been deleted",
					},
				});

				set.status = 401;

				return accountNotAvailableError.toJSON();
			}

			if (userFlags.PrivateFlags.has("Terminated") || userFlags.PrivateFlags.has("Disabled")) {
				app.Logger.debug("Account Is Disabled or Terminated");

				accountNotAvailableError.AddError({
					email: {
						code: "AccountDisabled",
						message: "The Account has been disabled",
					},
				});

				set.status = 401;

				return accountNotAvailableError.toJSON();
			}

			if (
				(isBot && (!userFlags.PrivateFlags.has("Bot") || !userFlags.PrivateFlags.has("VerifiedBot"))) ||
				(!isBot && (userFlags.PrivateFlags.has("Bot") || userFlags.PrivateFlags.has("VerifiedBot")))
			) {
				app.Logger.debug(
					"The user has a (or is missing) a flag its not meant to (bot) and is using an invalid header tbh idk how to log this well",
					isBot,
					(!isBot && userFlags.PrivateFlags.has("Bot")) || userFlags.PrivateFlags.has("VerifiedBot"),
					(isBot && !userFlags.PrivateFlags.has("Bot")) || !userFlags.PrivateFlags.has("VerifiedBot"),
				);

				unAuthorizedError.AddError({
					user: {
						code: "InvalidUserType",
						message: "You are not allowed to access this endpoint.",
					},
				});

				set.status = 401;

				return unAuthorizedError.toJSON();
			}

			if (
				options.AllowedRequesters === "User" &&
				(userFlags.PrivateFlags.has("Bot") || userFlags.PrivateFlags.has("VerifiedBot"))
			) {
				app.Logger.debug("User only endpoint though user is a bot");

				unAuthorizedError.AddError({
					user: {
						code: "InvalidToken",
						message: "Unauthorized",
					},
				});

				set.status = 401;

				return unAuthorizedError.toJSON();
			}

			if (
				options.AllowedRequesters === "Bot" &&
				!(userFlags.PrivateFlags.has("Bot") || userFlags.PrivateFlags.has("VerifiedBot"))
			) {
				app.Logger.debug("Bot only endpoint though user is not a bot");

				unAuthorizedError.AddError({
					user: {
						code: "InvalidToken",
						message: "Unauthorized",
					},
				});

				set.status = 401;

				return unAuthorizedError.toJSON();
			}

			if (options.Flags && options.Flags.length > 0) {
				for (const flag of options.Flags) {
					if (!userFlags.PrivateFlags.has(flag)) {
						app.Logger.debug(`User is missing the ${flag} flag`);

						unAuthorizedError.AddError({
							user: {
								code: "InvalidToken",
								message: "Unauthorized",
							},
						});

						set.status = 401;

						return unAuthorizedError.toJSON();
					}
				}
			}

			if (options.DisallowedFlags && options.DisallowedFlags.length > 0) {
				for (const flag of options.DisallowedFlags) {
					if (userFlags.PrivateFlags.has(flag)) {
						app.Logger.debug(`User has the ${flag} flag`);

						unAuthorizedError.AddError({
							user: {
								code: "InvalidToken",
								message: "Unauthorized",
							},
						});

						set.status = 401;

						return unAuthorizedError.toJSON();
					}
				}
			}

			const completeDecrypted: { email: string; flags: string; guilds: string[]; password: string; userId: string } =
				Encryption.CompleteDecryption({
					...userData,
					Flags: userData.flags.toString(),
				});

			return {
				user: {
					Token: authHeader,
					Bot: userFlags.PrivateFlags.has("Bot") || userFlags.PrivateFlags.has("VerifiedBot"),
					FlagsUtil: userFlags,
					Email: completeDecrypted.email,
					Id: completeDecrypted.userId,
					Password: completeDecrypted.password,
					Guilds: completeDecrypted.guilds ?? [],
				},
			};
		}

		return "";
	};
};

export default userMiddleware;
