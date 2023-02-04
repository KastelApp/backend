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

import { HTTPErrors, Route } from "@kastelll/packages";
import User from "../../Middleware/User";
import type { LessUser } from "../../Types/Users/Users";
import schemaData from "../../Utils/SchemaData";
import { SettingSchema, UserSchema } from "../../Utils/Schemas/Schemas";
import { compareSync } from "bcrypt";
import Token from "../../Utils/Classes/Token";
import Encryption from "../../Utils/Classes/Encryption";

new Route(
  "/login",
  "POST",
  [
    User({
      Flags: [],
      AccessType: "LoggedOut",
      AllowedRequesters: "User",
    }),
  ],
  async (req, res) => {
    const { email, password }: { email: string; password: string } = req.body;

    if (!email || !password) {
      const Errors = new HTTPErrors(4000);

      if (!email)
        Errors.addError({
          email: {
            code: "EmailRequired",
            message: "Email is required",
          },
        });

      if (!password)
        Errors.addError({
          password: {
            code: "PasswordRequired",
            message: "Password is required",
          },
        });

      res.status(400).json(Errors.toJSON());

      return;
    }

    const UsersCache = await req.app.cache.get(`fullusers:${Encryption.encrypt(email)}`);

    if (UsersCache) {
      const UserCachedData = Encryption.completeDecryption(JSON.parse(UsersCache));

      const User = schemaData("RawUser", UserCachedData) as LessUser;

      if (User.Banned) {
        const Errors = new HTTPErrors(4002);

        Errors.addError({
          email: {
            code: "AccountTerminated",
            message: "Your account has been terminated.",
            reason: User.BannedReason,
          },
        });

        res.status(400).json(Errors.toJSON());

        return;
      }

      if (User.Locked) {
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

      if (User.AccountDeletionInProgress) {
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

      if (!User.Password) {
        const Errors = new HTTPErrors(4005);

        Errors.addError({
          email: {
            code: "PasswordNotSet",
            message:
              "Password not set, please reset your password (forgot password)",
          },
        });

        res.status(400).json(Errors.toJSON());

        return;
      }

      if (!compareSync(password, User.Password)) {
        const Errors = new HTTPErrors(4006);

        Errors.addError({
          password: {
            code: "PasswordIncorrect",
            message: "Password is incorrect",
          },
        });

        res.status(400).json(Errors.toJSON());

        return;
      }

      const Settings = await SettingSchema.findOne({
        User: Encryption.encrypt(User.id),
      });

      const UserToken = Token.GenerateToken(User.id);

      if (Settings) {
        Settings.Tokens.push(Encryption.encrypt(UserToken));
      } else {
        const NewSettings = new SettingSchema({
          User: Encryption.encrypt(User.id),
          Tokens: [Encryption.encrypt(UserToken)],
        });

        await NewSettings.save();
      }

      res.json({
        token: UserToken,
      });

      return;
    }

    const UserRaw = await UserSchema.findOne({ email: email });

    if (!UserRaw) {
      const Errors = new HTTPErrors(4001);

      Errors.addError({
        email: {
          code: "EmailNotFound",
          message: "Email not found",
        },
      });

      res.status(400).json(Errors.toJSON());

      return;
    }

    const User = schemaData("RawUser", Encryption.completeDecryption(UserRaw.toJSON())) as LessUser;

    if (User.Banned) {
      const Errors = new HTTPErrors(4002);

      Errors.addError({
        email: {
          code: "AccountTerminated",
          message: "Your account has been terminated.",
          reason: User.BannedReason,
        },
      });

      res.status(400).json(Errors.toJSON());

      return;
    }

    if (User.Locked) {
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

    if (User.AccountDeletionInProgress) {
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

    if (!User.Password) {
      const Errors = new HTTPErrors(4005);

      Errors.addError({
        email: {
          code: "PasswordNotSet",
          message:
            "Password not set, please reset your password (forgot password)",
        },
      });

      res.status(400).json(Errors.toJSON());

      return;
    }

    if (!compareSync(password, User.Password)) {
      const Errors = new HTTPErrors(4006);

      Errors.addError({
        password: {
          code: "PasswordIncorrect",
          message: "Password is incorrect",
        },
      });

      res.status(400).json(Errors.toJSON());

      return;
    }

    const UserToken = Token.GenerateToken(User.id);

    const Settings = await SettingSchema.findOne({
      User: Encryption.encrypt(User.id),
    });

    if (Settings) {
      Settings.Tokens.push(Encryption.encrypt(UserToken));

      await Settings.save();
    } else {
      const NewSettings = new SettingSchema({
        User: Encryption.encrypt(User.id),
        Tokens: [Encryption.encrypt(UserToken)],
      });

      await NewSettings.save();
    }

    res.json({
      token: UserToken,
    });

    return;
  }
);
