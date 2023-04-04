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
import type { LessUser } from "../../../Types/Users/Users";
// import Encryption from "../Encryption";
import Permissions from "../BitFields/Permissions";
import GuildMemberFlags from "../BitFields/GuildMember";
import Utils from "./Utils";
import { ChannelSchema, MessageSchema } from "../../Schemas/Schemas";
import { Snowflake } from "@kastelll/packages";
import schemaData from "../../SchemaData";
import Encryption from "../Encryption";
import type { PopulatedMessage } from "../../../Types/Guilds/Message";
import { MessageFlags, Permissions as Perms } from "../../../Constants";

// Description: This is a class for Managing stuff Channel related
// sending new messages, editing messages, deleting messages, etc

class ChannelUtils {
  Token: string;
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

    this.req = req;

    this.res = res;

    this.user = req.user;

    this.Utils = Utils;
  }

  async fetchChannelStuff(ChannelId: string) {
    const Guilds = await this.Utils.User.getGuilds();

    const Guild = Guilds.find((g) =>
      g.Channels.find((c) => c._id === ChannelId)
    );

    if (!Guild)
      return {
        Guild: null,
        Channel: null,
        GuildMember: null,
      };

    const GuildMember = Guild.Members.find((m) => m.User._id === this.user?.Id);

    if (!GuildMember)
      return {
        Guild: null,
        Channel: null,
        GuildMember: null,
      };

    const Channel = Guild.Channels.find((c) => c._id === ChannelId);

    if (!Channel)
      return {
        Guild: null,
        Channel: null,
        GuildMember: null,
      };

    return {
      Guild,
      Channel,
      GuildMember,
    };
  }

  // TODO: Check for PermissionOverides
  async hasPermission(
    ChannelId: string,
    Permission: keyof typeof Perms | (keyof typeof Perms)[],
    Single?: boolean // If Permission is an Array Single will return true if the role has at least one of the permissions
  ): Promise<boolean> {
    const { Guild, Channel, GuildMember } = await this.fetchChannelStuff(
      ChannelId
    );

    if (!Guild || !Channel || !GuildMember) return false;

    const MemberFlags = new GuildMemberFlags(Number(GuildMember.Flags));

    if (!MemberFlags.hasString("In")) return false;

    if (MemberFlags.hasString("Owner") || MemberFlags.hasString("CoOwner"))
      return true;

    const OneRoleHasPermission = GuildMember.Roles.some((r) => {
      const Role = Guild.Roles.find((gr) => gr._id === r);

      if (!Role) return false;

      const RolePermissions = new Permissions(Number(Role.Permissions));

      if (Array.isArray(Permission)) {
        if (Single) {
          return Permission.some((p) => RolePermissions.hasString(p));
        } else {
          return Permission.every((p) => RolePermissions.hasString(p));
        }
      }

      return RolePermissions.hasString(Permission);
    });

    if (OneRoleHasPermission) return true;

    return false;
  }

  // This is for Guilds not DM channels
  async canSendMessage(ChannelId: string): Promise<boolean> {
    const { Guild, Channel, GuildMember } = await this.fetchChannelStuff(
      ChannelId
    );

    if (!Guild || !Channel || !GuildMember) return false;

    const MemberFlags = new GuildMemberFlags(Number(GuildMember.Flags));

    if (!MemberFlags.hasString("In")) return false;

    if (MemberFlags.hasString("Owner") || MemberFlags.hasString("CoOwner"))
      return true;

    const OneRoleHasPermission = GuildMember.Roles.some((r) => {
      const Role = Guild.Roles.find((gr) => gr._id === r);

      if (!Role) return false;

      const RolePermissions = new Permissions(Number(Role.Permissions));

      return RolePermissions.hasString("SendMessages");
    });

    if (OneRoleHasPermission) return true;

    return false;
  }

  async getMember(ChannelId: string, UserId: string) {
    const Guild = await this.Utils.User.getGuilds();

    const GuildData = Guild.find((g) =>
      g.Channels.find((c) => c._id === ChannelId)
    );

    if (!GuildData) return null;

    const Member = GuildData.Members.find((m) => m.User._id === UserId);

    if (!Member) return null;

    return Member;
  }

  async fetchMessages(
    ChannelId: string,
    Limit: number = 50,
    Before?: string,
    After?: string
  ): Promise<PopulatedMessage[]> {
    const BeforeDate = Before ? Snowflake.timeStamp(Before) : null;
    const AfterDate = After ? Snowflake.timeStamp(After) : null;

    const FetchedMessage = await MessageSchema.find({
      Channel: Encryption.encrypt(ChannelId),
      CreatedDate: BeforeDate
        ? {
            $lt: BeforeDate,
          }
        : AfterDate
        ? {
            $gt: AfterDate,
          }
        : {
            $lt: Date.now(),
          },
    })
      .sort({
        CreatedDate: -1,
      })
      .limit(Limit);

    const Messages = [];

    for (const Message of FetchedMessage) {
      await Message.populate("Author");

      await Message.populate("Author.User");

      Messages.push(Message.toJSON());
    }

    const Schemad = schemaData("Messages", Messages);

    return Encryption.completeDecryption(Schemad);
  }

  async fetchMessage(ChannelId: string, MessageId: string): Promise<PopulatedMessage | null> {
    const Message = await MessageSchema.findOne({
        Channel: Encryption.encrypt(ChannelId),
        _id: Encryption.encrypt(MessageId)
    });

    if (!Message) return null;

    await Message.populate("Author");

    await Message.populate("Author.User");

    const Schemad = schemaData("Message", Message.toJSON());

    return Encryption.completeDecryption(Schemad);
    }

  async deleteMessages(
    ChannelId: string,
    MessageIds: string[]
  ): Promise<boolean> {
    await MessageSchema.deleteMany({
        Channel: Encryption.encrypt(ChannelId),
        _id: {
            $in: Encryption.completeEncryption(MessageIds)
        }
    })

    return true;
  }

  async editMessage(
    ChannelId: string,
    MessageId: string,
    Content: string,
    AllowedMentions: number,
    Flags?: number
  ): Promise<PopulatedMessage | null> {
    await MessageSchema.updateOne({
        Channel: Encryption.encrypt(ChannelId),
        ...Content ? { Content: Encryption.encrypt(Content) } : {},
        ...AllowedMentions ? { AllowedMentions: AllowedMentions } : {},
        UpdatedDate: Date.now(),
    });

    const Message = await MessageSchema.findOne({
        _id: Encryption.encrypt(MessageId),
        Channel: Encryption.encrypt(ChannelId)
    });

    if (!Message) return null;

    await Message.populate("Author");

    await Message.populate("Author.User");

    const Schemad = schemaData("Message", Message.toJSON());

    return Encryption.completeDecryption(Schemad);
  }

  async createMessage(
    ChannelId: string,
    MessageId: string,
    AuthorId: string,
    Content: string,
    Nonce: string,
    AllowedMentions: number,
    Flags: number,
    ReplyingTo?: string
  ): Promise<PopulatedMessage | null> {
    const Message = await MessageSchema.create({
      _id: Encryption.encrypt(MessageId), 
      Channel: Encryption.encrypt(ChannelId),
      Author: Encryption.encrypt(AuthorId),
      Content: Encryption.encrypt(Content),
      Nonce: Encryption.encrypt(Nonce),
      CreatedDate: Date.now(),
      Flags: ReplyingTo ? MessageFlags.Reply : MessageFlags.Normal,
      ReplyingTo: ReplyingTo ? Encryption.encrypt(ReplyingTo) : null,
      AllowedMentions: AllowedMentions,
    });

    await Message.populate("Author");

    await Message.populate("Author.User");

    const Schemad = schemaData("Message", Message.toJSON());

    return Encryption.completeDecryption(Schemad);
  }

  async deleteChannel(ChannelId: string): Promise<boolean> {
    const ChannelDeleted = await ChannelSchema.deleteOne({
      _id: Encryption.encrypt(ChannelId),
    });

    if (ChannelDeleted.deletedCount === 0) return false;

    return true;
  }
}

export default ChannelUtils;

export { ChannelUtils };
