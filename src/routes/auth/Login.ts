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
import Captcha from "../../Middleware/Captcha";
import Constants from "../../Constants";

new Route(
  "/login",
  "POST",
  [
    User({
      AccessType: "LoggedOut",
      AllowedRequesters: "User",
    }),
    Captcha({
      Enabled: Constants.Settings.Captcha.Login
  })
  ],
  async (req, res) => {
    const { email, password }: { email: string; password: string } = req.body;

    if (!email || !password) {
      const Errors = new HTTPErrors(4000);

      if (!email)
        Errors.addError({
          Email: {
            Code: "EmailRequired",
            Message: "Email is required",
          },
        });

      if (!password)
        Errors.addError({
          Password: {
            Code: "PasswordRequired",
            Message: "Password is required",
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
          Email: {
            Code: "AccountTerminated",
            Message: "Your account has been terminated.",
            Reason: User.BannedReason,
          },
        });

        res.status(400).json(Errors.toJSON());

        return;
      }

      if (User.Locked) {
        const Errors = new HTTPErrors(4003);

        Errors.addError({
          Email: {
            Code: "AccountDisabled",
            Message: "Your account is disabled, please contact support!",
          },
        });

        res.status(400).json(Errors.toJSON());

        return;
      }

      if (User.AccountDeletionInProgress) {
        const Errors = new HTTPErrors(4004);

        Errors.addError({
          Email: {
            Code: "AccountDeletionInProgress",
            Message:
              "Your account is currently being deleted, If you would like to cancel this, please contact support",
          },
        });

        res.status(400).json(Errors.toJSON());

        return;
      }

      if (!User.Password) {
        const Errors = new HTTPErrors(4005);

        Errors.addError({
          Email: {
            Code: "PasswordNotSet",
            Message:
              "Password not set, please reset your password (forgot password)",
          },
        });

        res.status(400).json(Errors.toJSON());

        return;
      }

      if (!compareSync(password, User.Password)) {
        const Errors = new HTTPErrors(4006);

        Errors.addError({
          Password: {
            Code: "PasswordIncorrect",
            Message: "Password is incorrect",
          },
        });

        res.status(400).json(Errors.toJSON());

        return;
      }

      const Settings = await SettingSchema.findOne({
        User: Encryption.encrypt(User.Id),
      });

      const UserToken = Token.GenerateToken(User.Id);

      if (Settings) {
        Settings.Tokens.push(Encryption.encrypt(UserToken));
      } else {
        const NewSettings = new SettingSchema({
          User: Encryption.encrypt(User.Id),
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
        Email: {
          Code: "EmailNotFound",
          Message: "Email not found",
        },
      });

      res.status(400).json(Errors.toJSON());

      return;
    }

    const User = schemaData("RawUser", Encryption.completeDecryption(UserRaw.toJSON())) as LessUser;

    if (User.Banned) {
      const Errors = new HTTPErrors(4002);

      Errors.addError({
        Email: {
          Code: "AccountTerminated",
          Message: "Your account has been terminated.",
          Reason: User.BannedReason,
        },
      });

      res.status(400).json(Errors.toJSON());

      return;
    }

    if (User.Locked) {
      const Errors = new HTTPErrors(4003);

      Errors.addError({
        Email: {
          Code: "AccountDisabled",
          Message: "Your account is disabled, please contact support!",
        },
      });

      res.status(400).json(Errors.toJSON());

      return;
    }

    if (User.AccountDeletionInProgress) {
      const Errors = new HTTPErrors(4004);

      Errors.addError({
        Email: {
          Code: "AccountDeletionInProgress",
          Message:
            "Your account is currently being deleted, If you would like to cancel this, please contact support",
        },
      });

      res.status(400).json(Errors.toJSON());

      return;
    }

    if (!User.Password) {
      const Errors = new HTTPErrors(4005);

      Errors.addError({
        Email: {
          Code: "PasswordNotSet",
          Message:
            "Password not set, please reset your password (forgot password)",
        },
      });

      res.status(400).json(Errors.toJSON());

      return;
    }

    if (!compareSync(password, User.Password)) {
      const Errors = new HTTPErrors(4006);

      Errors.addError({
        Password: {
          Code: "PasswordIncorrect",
          Message: "Password is incorrect",
        },
      });

      res.status(400).json(Errors.toJSON());

      return;
    }

    console.log(User);

    const UserToken = Token.GenerateToken(User.Id);

    const Settings = await SettingSchema.findOne({
      User: Encryption.encrypt(User.Id),
    });

    if (Settings) {
      Settings.Tokens.push(Encryption.encrypt(UserToken));

      await Settings.save();
    } else {
      const NewSettings = new SettingSchema({
        User: Encryption.encrypt(User.Id),
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
