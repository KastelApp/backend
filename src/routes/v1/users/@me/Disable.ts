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
import { compareSync } from "bcrypt";
import User from "../../../../Middleware/User";
import Encryption from "../../../../Utils/Classes/Encryption";
import { SettingSchema, UserSchema } from "../../../../Utils/Schemas/Schemas";

interface DisableBody {
  password: string;
}

// TODO: Add account to queue to be wiped

new Route(
  "/",
  "PUT",
  [
    User({
      AccessType: "LoggedIn",
      AllowedRequesters: "All",
      Flags: [],
    }),
  ],
  async (req, res) => {
    const { password } = req.body as DisableBody;

    if (!password) {
      const Errors = new HTTPErrors(4014);

      Errors.addError({
        password: {
          code: "MissingPassword",
          message: "You must provide your password to disable your account",
        },
      });

      res.status(400).json(Errors.toJSON());

      return;
    }

    const FoundUser = await UserSchema.findById(
      Encryption.encrypt(req.user.id)
    );

    if (!compareSync(password, FoundUser?.Password as string)) {
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

    await FoundUser?.updateOne({
      $set: {
        Locked: true,
      },
    });

    const UsersSettings = await SettingSchema.findOne({
      User: Encryption.encrypt(req.user.id),
    });

    if (UsersSettings) {
      await UsersSettings.updateOne({
        $set: {
          Tokens: [],
        },
      });
    }

    res.status(200).json({
      message: "Account disabled",
    });

    return;
  }
);
