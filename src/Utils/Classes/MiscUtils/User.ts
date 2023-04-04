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

// TODO: Add more stuff to this class

import type { Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";
import type { LessUser, PopulatedUserWJ } from "../../../Types/Users/Users";
import schemaData from "../../SchemaData";
import { FriendSchema, SettingSchema, UserSchema } from "../../Schemas/Schemas";
import Encryption from "../Encryption";
import { RelationshipFlags } from "../../../Constants";
import type { GuildPermissions } from "../../../Types/Guilds/User";
import Permissions from "../BitFields/Permissions";
import GuildMemberFlags from "../BitFields/GuildMember";
import Utils from "./Utils";

// Description: This class is used to store user data, and to flush it to the database
// Its main purpose is for setting when someone fails a request, we then flush it to the rate limiter database
// this way our rate limiter can be dynamic and not just a static number
// failed_requests % 5 === 0 ? failed_requests / 5 : failed_requests % 5 (Example formula)
// Do note this is in a very early stage, and is not fully implemented yet, Stuff will be added over time but we are unsure
// when it will be used in development, but it will be used in the future (hopefully)

class UserUtils {
  Token: string;
  Failed: boolean;
  FailedCode: number | null;
  req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>;
  res: Response<any, Record<string, any>>;
  user: LessUser;
  Utils: Utils;
  constructor(
    Token: string,
    req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
    res: Response<any, Record<string, any>>,
    Utils: Utils
  ) {
    this.Token = Token;

    this.Failed = false;

    this.FailedCode = null;

    this.req = req;

    this.res = res;

    this.user = req.user;

    this.Utils = Utils;
  }

  SetFailed(code: number) {
    this.Failed = true;
    this.FailedCode = code;
  }

  reply(code: number, data: any) {
    if (typeof data === "object") {
      this.res.status(code).json(data);
    } else {
      this.res.status(code).send(data);
    }
  }

  async fetchFriends(FilterBlocked = false) {
    const FriendsR = await FriendSchema.find({
      Receiver: Encryption.encrypt(this.user.Id as string),
    });

    const FriendsS = await FriendSchema.find({
      Sender: Encryption.encrypt(this.user.Id as string),
    });

    const FriendRArray: {
      Sender: PopulatedUserWJ;
      Receiver: PopulatedUserWJ;
      Flags: number;
    }[] = [];

    const FriendSArray: {
      Sender: PopulatedUserWJ;
      Receiver: PopulatedUserWJ;
      Flags: number;
    }[] = [];

    for (const Friend of FriendsR) {
      if (FilterBlocked && Friend.Flags === RelationshipFlags.Blocked) continue;

      const PopulatedFriend = await Friend.populate<{
        Sender: PopulatedUserWJ;
        Receiver: PopulatedUserWJ;
      }>(["Receiver", "Sender"]);

      const FixedData = schemaData("Friend", {
        Sender: Encryption.completeDecryption(PopulatedFriend.toJSON()),
        Receiver: Encryption.completeDecryption(PopulatedFriend.toJSON()),
        Flags: Friend.Flags,
      });

      FriendRArray.push(FixedData);
    }

    for (const Friend of FriendsS) {
      if (FilterBlocked && Friend.Flags === RelationshipFlags.Blocked) continue;

      const PopulatedFriend = await Friend.populate<{
        Sender: PopulatedUserWJ;
        Receiver: PopulatedUserWJ;
      }>(["Receiver", "Sender"]);

      const FixedData = schemaData("Friend", {
        Sender: Encryption.completeDecryption(PopulatedFriend.toJSON()),
        Receiver: Encryption.completeDecryption(PopulatedFriend.toJSON()),
        Flags: Friend.Flags,
      });

      FriendSArray.push(FixedData);
    }

    return [...FriendRArray, ...FriendSArray];
  }

  // This is for Guilds not DM channels
  async canSendMessagesGuildV(ChannelId: string): Promise<boolean> {
    const Guilds = await this.getGuilds();

    const Guild = Guilds.find((g) =>
      g.Channels.find((c) => c._id === ChannelId)
    );

    if (!Guild) return false;

    const GuildMember = Guild.Members.find((m) => m.User._id === this.user?.Id);

    if (!GuildMember) return false;

    const MemberFlags = new GuildMemberFlags(Number(GuildMember.Flags));

    if (!MemberFlags.hasString("In")) return false;

    if (MemberFlags.hasString("Owner") || MemberFlags.hasString("CoOwner"))
      return true;

    // Soon we will check for PermissionOverides
    const Channel = Guild.Channels.find((c) => c._id === ChannelId);

    if (!Channel) return false;

    const OneRoleHasPermission = GuildMember.Roles.some((r) => {
      const Role = Guild.Roles.find((gr) => gr._id === r);

      if (!Role) return false;

      const RolePermissions = new Permissions(Number(Role.Permissions));

      return RolePermissions.hasString("SendMessages");
    });

    if (OneRoleHasPermission) return true;

    return false;
  }

  async getGuilds(): Promise<GuildPermissions[]> {
    const UserSchemad = await UserSchema.findById(
      Encryption.encrypt(this.user.Id as string)
    );

    if (!UserSchemad) return [];

    await UserSchemad.populate("Guilds");

    await UserSchemad.populate([
      "Guilds.Members",
      "Guilds.Roles",
      "Guilds.Channels",
    ]);

    await UserSchemad.populate([
      "Guilds.Members.User",
      "Guilds.Channels.PermissionsOverides",
    ]);

    return Encryption.completeDecryption(UserSchemad.toObject().Guilds);
  }

  async getMember(GuildId: string, UserId: string) {
    const Guild = await this.getGuilds();

    const GuildData = Guild.find((g) => g._id === GuildId);

    if (!GuildData) return null;

    const Member = GuildData.Members.find((m) => m.User._id === UserId);

    if (!Member) return null;

    return Member;
  }

  async getMemberFromChannel(ChannelId: string, UserId: string) {
    const Guild = await this.getGuilds();

    const GuildData = Guild.find((g) =>
      g.Channels.find((c) => c._id === ChannelId)
    );

    if (!GuildData) return null;

    const Member = GuildData.Members.find((m) => m.User._id === UserId);

    if (!Member) return null;

    return Member;
  }

  async getSessions(): Promise<{
      Token: string;
      CreatedDate: Date;
      Ip: string;
    }[]> {
    const Settings = await SettingSchema.findOne({
      User: Encryption.encrypt(this.user.Id as string),
    });

    if (!Settings) return [];

    return Encryption.completeDecryption(Settings.toJSON().Tokens.map((t) => {
      return {
        Token: t.Token,
        CreatedDate: t.CreatedDate,
        Ip: t.Ip,
      };
    }));
  }
}

export default UserUtils;

export { UserUtils as User };
