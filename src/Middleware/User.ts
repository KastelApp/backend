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

import { HTTPErrors } from "@kastelll/packages";
import type { NextFunction, Request, Response } from "express";
import type { UserMiddleware } from "../Types/Routes";
import type { LessUser, PopulatedUser } from "../Types/Users/Users";
import FlagFields from "../Utils/Classes/BitFields/Flags";
import Encryption from "../Utils/Classes/Encryption";
import Token from "../Utils/Classes/Token";
import schemaData from "../Utils/SchemaData";
import { SettingSchema } from "../Utils/Schemas/Schemas";

/**
 * The Middleware on each and every request (well it should be on it)
 * Manages everything user related to what type of user can access (bot or normal user)
 * and what flags are needed/allowed to access the endpoint, As well as if they need to be
 * logged in or not
 */
const User = (options: UserMiddleware) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    let AuthHeader = req.headers.authorization;

    if (AuthHeader?.includes("Bot") && options.AllowedRequesters === "User") {
      res.status(401).json({
        code: 4013,
        message: "You are not allowed to access this endpoint.",
      });

      return;
    }

    AuthHeader?.split(" ").length == 2
      ? (AuthHeader = AuthHeader.split(" ")[1])
      : (AuthHeader = AuthHeader);

    if (options.AccessType === "LoggedIn" && !AuthHeader) {
      res.status(401).json({
        code: 4010,
        message: "You need to be logged in to access this endpoint",
      });

      return;
    }

    if (options.AccessType === "LoggedOut" && AuthHeader) {
      res.status(401).json({
        code: 4011,
        message: "You are not allowed to access this endpoint.",
      });

      return;
    }

    if (options.AccessType === "LoggedIn" && AuthHeader) {
      const VaildatedToken = Token.ValidateToken(AuthHeader);

      if (!VaildatedToken) {
        res.status(401).json({
          code: 4012,
          message: "Unauthorized",
        });

        return;
      }

      const DecodedToken = Token.DecodeToken(AuthHeader);

      const UsersSettings = await SettingSchema.findOne({
        User: Encryption.encrypt(DecodedToken.Snowflake),
      });

      if (!UsersSettings) {
        res.status(401).json({
          code: 4012,
          message: "Unauthorized",
        });

        return;
      }

      const PopulatedUser = await UsersSettings.populate<{
        User: PopulatedUser;
      }>("User");

      if (!PopulatedUser) {
        res.status(401).json({
          code: 4012,
          message: "Unauthorized",
        });

        return;
      }

      const UsersFlags = new FlagFields(PopulatedUser.User.Flags);

      if (PopulatedUser.User.Banned) {
        const Errors = new HTTPErrors(4002);

        Errors.addError({
          email: {
            code: "AccountTerminated",
            message: "Your account has been terminated.",
            reason: PopulatedUser.User.BanReason,
          },
        });

        res.status(400).json(Errors.toJSON());

        return;
      }

      if (PopulatedUser.User.Locked) {
        const Errors = new HTTPErrors(4003);

        Errors.addError({
          email: {
            code: "AccountDisabled",
            message: "Your account is disabled, please contact support!",
          },
        });

        res.status(400).json(Errors.toJSON());

        return;
      }

      if (PopulatedUser.User.AccountDeletionInProgress) {
        const Errors = new HTTPErrors(4004);

        Errors.addError({
          email: {
            code: "AccountDeletionInProgress",
            message:
              "Your account is currently being deleted, If you would like to cancel this, please contact support",
          },
        });

        res.status(400).json(Errors.toJSON());

        return;
      }

      if (!PopulatedUser.Tokens.includes(Encryption.encrypt(AuthHeader))) {
        res.status(401).json({
          code: 4012,
          message: "Unauthorized",
        });

        return;
      }

      if (
        options.AllowedRequesters === "User" &&
        (UsersFlags.hasString("Bot") || UsersFlags.hasString("VerifiedBot"))
      ) {
        res.status(401).json({
          code: 4011,
          message: "You are not allowed to access this endpoint.",
        });

        return;
      }

      if (
        options.AllowedRequesters === "Bot" &&
        !(UsersFlags.hasString("Bot") || UsersFlags.hasString("VerifiedBot"))
      ) {
        res.status(401).json({
          code: 4011,
          message: "You are not allowed to access this endpoint.",
        });

        return;
      }

      if (options.Flags) {
        if (options.Flags.length > 0) {
          for (const Flag of options.Flags) {
            if (!UsersFlags.hasString(Flag)) {
              res.status(401).json({
                code: 4011,
                message: "You are not allowed to access this endpoint.",
              });

              return;
            }
          }
        }
      }

      if (options.DisallowedFlags) {
        if (options.DisallowedFlags.length > 0) {
          for (const Flag of options.DisallowedFlags) {
            if (UsersFlags.hasString(Flag)) {
              res.status(401).json({
                code: 4011,
                message: "You are not allowed to access this endpoint.",
              });

              return;
            }
          }
        }
      }

      const CompleteDecrypted = Encryption.completeDecryption(
        PopulatedUser.User.toJSON()
      );

      const SchemaUserd = schemaData("RawUser", CompleteDecrypted);

      req.user = {
        ...SchemaUserd,
        Token: AuthHeader,
        Bot: false,
      } as LessUser;

      next();

      return;
    }

    next();
  };
};

export default User;

export { User };
