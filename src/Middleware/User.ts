import type { UserMiddleware } from "@/Types/Routes.ts";
import FlagFields from "@/Utils/Classes/BitFields/Flags.ts";
import Encryption from "@/Utils/Classes/Encryption.ts";
import ErrorGen from "@/Utils/Classes/ErrorGen.ts";
import type { CreateMiddleware, CreateRoute } from "@/Utils/Classes/Route.ts";
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
    }
}

const User = (options: UserMiddleware) => {
    return async ({ headers, set, app }: CreateRoute<string, {}>): Promise<CreateMiddleware<UserMiddlewareType | string | { Code: number, Errors: { [key: string]: any } }>> => {
        let AuthHeader = headers.authorization;
        const AuthIsBot = headers.authorization?.toLowerCase()?.startsWith("bot ") ?? false;
        
        const UnAuthorized = ErrorGen.UnAuthorized();

        if ((AuthIsBot && options.AllowedRequesters === "User") || (!AuthIsBot && options.AllowedRequesters === "Bot")) {
            app.Logger.debug(`Unexpected User Type ${AuthIsBot ? "Is Bot" : "Isn't Bot"}`);

            UnAuthorized.AddError({
                User: {
                    Code: "InvalidUserType",
                    Message: "You are not allowed to access this endpoint.",
                },
            });

            set.status = 401;

            return UnAuthorized.toJSON();
        }

        AuthHeader = AuthHeader?.split(" ").length === 2 ? AuthHeader.split(" ")[1] : AuthHeader;

        if (options.AccessType === "LoggedIn" && !AuthHeader) {
            app.Logger.debug("User isn't logged in though it is expected");

            UnAuthorized.AddError({
                User: {
                    Code: "NotLoggedIn",
                    Message: "You need to be logged in to access this endpoint",
                },
            });

            set.status = 401;

            return UnAuthorized.toJSON();
        }

        if (options.AccessType === "LoggedOut" && AuthHeader) {
            app.Logger.debug("User is logged in though its not expected");

            UnAuthorized.AddError({
                User: {
                    Code: "LoggedIn",
                    Message: "You are not allowed to access this endpoint.",
                },
            });

            set.status = 401;

            return UnAuthorized.toJSON();
        }

        if (options.AccessType === "LoggedIn" && AuthHeader) {
            const VaildatedToken = Token.ValidateToken(AuthHeader);

            if (!VaildatedToken) {
                app.Logger.debug("Token couldn't be validated");

                UnAuthorized.AddError({
                    User: {
                        Code: "InvalidToken",
                        Message: "Unauthorized",
                    },
                });

                set.status = 401;

                return UnAuthorized.toJSON();
            }

            const DecodedToken = Token.DecodeToken(AuthHeader);

            const UsersSettings = await options.App.Cassandra.Models.Settings.get(
                {
                    UserId: Encryption.Encrypt(DecodedToken.Snowflake),
                },
                {
                    fields: ["tokens", "max_file_upload_size"],
                },
            );

            const UserData = await options.App.Cassandra.Models.User.get(
                {
                    UserId: Encryption.Encrypt(DecodedToken.Snowflake),
                },
                {
                    fields: ["email", "user_id", "flags", "password", "public_flags", "guilds"],
                },
            );

            if (!UsersSettings || !UserData) {
                app.Logger.debug("User settings wasn't found", DecodedToken.Snowflake);
                app.Logger.debug(UserData, UsersSettings);

                UnAuthorized.AddError({
                    User: {
                        Code: "InvalidToken",
                        Message: "Unauthorized",
                    },
                });

                if (!UsersSettings || !UserData) {
                    // darkerink: just in case there is one but not the other (has happened in very rare cases) contacting support will be the only way to fix this (for now);
                    // Res.status(500).send("Internal Server Error :(");

                    set.status = 500;

                    return "Internal Server Error :(";
                } else {
                    set.status = 401;

                    return UnAuthorized.toJSON();
                }
            }

            if (!UsersSettings?.Tokens?.some((Token) => Token.Token === Encryption.Encrypt(AuthHeader as string))) {
                app.Logger.debug("Token not found in the user settings");

                UnAuthorized.AddError({
                    User: {
                        Code: "InvalidToken",
                        Message: "Unauthorized",
                    },
                });

                // Res.status(401).json(UnAuthorized.toJSON());

                set.status = 401;

                return UnAuthorized.toJSON();
            }

            const UserFlags = new FlagFields(UserData.Flags, UserData.PublicFlags);

            if (
                UserFlags.PrivateFlags.has("AccountDeleted") ||
                UserFlags.PrivateFlags.has("WaitingOnDisableDataUpdate") ||
                UserFlags.PrivateFlags.has("WaitingOnAccountDeletion")
            ) {
                const Error = ErrorGen.AccountNotAvailable();

                app.Logger.debug("Account Is Deleted or about to be deleted");

                Error.AddError({
                    Email: {
                        Code: "AccountDeleted",
                        Message: "The Account has been deleted",
                    },
                });

                set.status = 401;

                return Error.toJSON();
            }

            if (UserFlags.PrivateFlags.has("Terminated") || UserFlags.PrivateFlags.has("Disabled")) {
                const Error = ErrorGen.AccountNotAvailable();

                app.Logger.debug("Account Is Disabled or Terminated");

                Error.AddError({
                    Email: {
                        Code: "AccountDisabled",
                        Message: "The Account has been disabled",
                    },
                });

                set.status = 401;

                return Error.toJSON();
            }

            if (
                (AuthIsBot && (!UserFlags.PrivateFlags.has("Bot") || !UserFlags.PrivateFlags.has("VerifiedBot"))) ||
                (!AuthIsBot && (UserFlags.PrivateFlags.has("Bot") || UserFlags.PrivateFlags.has("VerifiedBot")))
            ) {
                app.Logger.debug(
                    "The user has a (or is missing) a flag its not meant to (bot) and is using an invalid header tbh idk how to log this well",
                    AuthIsBot,
                    (!AuthIsBot && UserFlags.PrivateFlags.has("Bot")) || UserFlags.PrivateFlags.has("VerifiedBot"),
                    (AuthIsBot && !UserFlags.PrivateFlags.has("Bot")) || !UserFlags.PrivateFlags.has("VerifiedBot"),
                );

                UnAuthorized.AddError({
                    User: {
                        Code: "InvalidUserType",
                        Message: "You are not allowed to access this endpoint.",
                    },
                });

                set.status = 401;

                return UnAuthorized.toJSON();
            }

            if (
                options.AllowedRequesters === "User" &&
                (UserFlags.PrivateFlags.has("Bot") || UserFlags.PrivateFlags.has("VerifiedBot"))
            ) {
                app.Logger.debug("User only endpoint though user is a bot");

                UnAuthorized.AddError({
                    User: {
                        Code: "InvalidToken",
                        Message: "Unauthorized",
                    },
                });

                set.status = 401;

                return UnAuthorized.toJSON();
            }

            if (
                options.AllowedRequesters === "Bot" &&
                !(UserFlags.PrivateFlags.has("Bot") || UserFlags.PrivateFlags.has("VerifiedBot"))
            ) {
                app.Logger.debug("Bot only endpoint though user is not a bot");

                UnAuthorized.AddError({
                    User: {
                        Code: "InvalidToken",
                        Message: "Unauthorized",
                    },
                });

                set.status = 401;

                return UnAuthorized.toJSON();
            }

            if (options.Flags && options.Flags.length > 0) {
                for (const Flag of options.Flags) {
                    if (!UserFlags.PrivateFlags.has(Flag)) {
                        app.Logger.debug(`User is missing the ${Flag} flag`);

                        UnAuthorized.AddError({
                            User: {
                                Code: "InvalidToken",
                                Message: "Unauthorized",
                            },
                        });

                        set.status = 401;

                        return UnAuthorized.toJSON();
                    }
                }
            }

            if (options.DisallowedFlags && options.DisallowedFlags.length > 0) {
                for (const Flag of options.DisallowedFlags) {
                    if (UserFlags.PrivateFlags.has(Flag)) {
                        app.Logger.debug(`User has the ${Flag} flag`);

                        UnAuthorized.AddError({
                            User: {
                                Code: "InvalidToken",
                                Message: "Unauthorized",
                            },
                        });

                        set.status = 401;

                        return UnAuthorized.toJSON();
                    }
                }
            }

            const CompleteDecrypted: { Email: string; Flags: string; Guilds: string[]; Password: string; UserId: string; } =
                Encryption.CompleteDecryption({
                    ...UserData,
                    Flags: UserData.Flags.toString(),
                });

            return {
                user: {
                    Token: AuthHeader,
                    Bot: UserFlags.PrivateFlags.has("Bot") || UserFlags.PrivateFlags.has("VerifiedBot"),
                    FlagsUtil: UserFlags,
                    Email: CompleteDecrypted.Email,
                    Id: CompleteDecrypted.UserId,
                    Password: CompleteDecrypted.Password,
                    Guilds: CompleteDecrypted.Guilds ?? []
                }
            };
        }

        return ""
    };
};


export default User;
