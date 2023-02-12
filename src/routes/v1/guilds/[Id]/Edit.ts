import { HTTPErrors, Route } from "@kastelll/packages";
import User from "../../../../Middleware/User";
import type { Role } from "../../../../Types/Guilds/Role";
import Permissions from "../../../../Utils/Classes/BitFields/Permissions";
import GuildMemberFlags from "../../../../Utils/Classes/BitFields/GuildMember";
import Encryption from "../../../../Utils/Classes/Encryption";
import {
  GuildMemberSchema,
  GuildSchema,
} from "../../../../Utils/Schemas/Schemas";

interface RequestBody {
  name: string;
  description: string;
  ownerId: string;
  serverIcon: string;
  maxMembers: number;
  twofaCode: string;
}

new Route(
  "/",
  "PATCH",
  [
    User({
      AccessType: "LoggedIn",
      AllowedRequesters: "All",
      DisallowedFlags: [],
    }),
  ],
  async (req, res) => {
    const { name, description, ownerId, maxMembers, twofaCode } =
      req.body as RequestBody;

    const { Id } = req.params as { Id: string };

    const GuildData = await GuildSchema.findById(Encryption.encrypt(Id));

    if (!GuildData) {
      const Errors = new HTTPErrors(4020);

      Errors.addError({
        Guild: {
          Code: "InvalidGuild",
          Message:
            "The guild you are trying to fetch does not exist or you do not have permission to view it.",
        },
      });

      res.status(400).json(Errors.toJSON());

      return;
    }

    const UserInSideTheServer = await GuildMemberSchema.findOne({
      User: Encryption.encrypt(req.user.Id),
      Guild: Encryption.encrypt(Id),
    });

    const MemberFlags = new GuildMemberFlags(UserInSideTheServer?.Flags ?? 0);

    if (!UserInSideTheServer) {
      const Errors = new HTTPErrors(4020);

      Errors.addError({
        Guild: {
          Code: "InvalidGuild",
          Message:
            "The guild you are trying to fetch does not exist or you do not have permission to view it.",
        },
      });

      res.status(400).json(Errors.toJSON());

      return;
    }

    const PopulatedUser = await UserInSideTheServer.populate<{
      Roles: Role[];
    }>("Roles");

    for (const Role of PopulatedUser.Roles) {
      const PermissionFlags = new Permissions(Number(Role.Permissions));

      if (
        PermissionFlags.hasString("ManageGuild") ||
        MemberFlags.hasString("Owner") ||
        MemberFlags.hasString("CoOwner")
      ) {
        // Break the loop (they got the permission)
        break;
      }

      // If its the last role in the array and they dont have the permission respond with an error
      if (
        PopulatedUser.Roles.indexOf(Role) ===
        PopulatedUser.Roles.length - 1
      ) {
        const Errors = new HTTPErrors(4021);

        Errors.addError({
          Permissions: {
            Code: "MissingPermission",
            Message: "You are missing permissions to do this action.",
          },
        });

        res.status(400).json(Errors.toJSON());

        return;
      }
    }

    // Changing MaxMembers is a staff only feature (This is just for testing/for offcial guilds that hit the limit)
    if (maxMembers && !req.user.FlagsUtil.hasString("Staff")) {
      const Errors = new HTTPErrors(4021);

      Errors.addError({
        Permissions: {
          Code: "MissingPermission",
          Message: "You are missing permissions to do this action.",
        },
      });

      res.status(400).json(Errors.toJSON());

      return;
    }

    if (name) GuildData.Name = Encryption.encrypt(name);

    if (description) GuildData.Description = Encryption.encrypt(description);

    if (ownerId) {
      if (!MemberFlags.hasString("Owner")) {
        const Errors = new HTTPErrors(4021);

        Errors.addError({
          Permissions: {
            Code: "MissingPermission",
            Message: "You are missing permissions to do this action.",
          },
        });

        res.status(400).json(Errors.toJSON());

        return;
      }

      if (req.user.TwoFa && !twofaCode) {
        const Errors = new HTTPErrors(4018);

        Errors.addError({
          TwoFa: {
            Code: "MissingTwoFa",
            Message: "You must provide a two factor authentication code.",
          },
        });

        res.status(400).json(Errors.toJSON());

        return;
      }

      if (req.user.TwoFa && twofaCode) {
        // TODO: Add 2FA check
      }

      const NewOwner = await GuildMemberSchema.findOne({
        User: Encryption.encrypt(ownerId),
        Guild: Encryption.encrypt(Id),
      });

      if (!NewOwner) {
        const Errors = new HTTPErrors(4021);

        Errors.addError({
          Member: {
            Code: "InvalidMember",
            Message:
              "The member you are trying to transfer ownership to is not in the guild.",
          },
        });
      }

      const NewOwnerFlags = new GuildMemberFlags(NewOwner?.Flags ?? 0);

      if (!NewOwnerFlags.hasString("In")) {
        const Errors = new HTTPErrors(4021);

        Errors.addError({
          Member: {
            Code: "InvalidMember",
            Message:
              "The member you are trying to transfer ownership to is not in the guild.",
          },
        });
      }

      if (NewOwnerFlags.hasString("Owner")) {
        const Errors = new HTTPErrors(4021);

        Errors.addError({
          Member: {
            Code: "InvalidMember",
            Message:
              "The member you are trying to transfer ownership to is already the owner.",
          },
        });
      }

      GuildData.Owner = NewOwner?._id as string;
    }

    if (maxMembers) GuildData.MaxMembers = maxMembers;

    await GuildData.save();

    res.status(200).json({
      Success: true,
      Message: "Guild updated successfully.",
    });
  }
);
