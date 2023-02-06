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
import type { LessUser, PopulatedUserWJ } from "../../Types/Users/Users";
import schemaData from "../SchemaData";
import { FriendSchema } from "../Schemas/Schemas";
import Encryption from "./Encryption";
import { RelationshipFlags } from "../../Constants";

// Description: This class is used to store user data, and to flush it to the database
// Its main purpose is for setting when someone fails a request, we then flush it to the rate limiter database
// this way our rate limiter can be dynamic and not just a static number
// failed_requests % 5 === 0 ? failed_requests / 5 : failed_requests % 5 (Example formula)
// Do note this is in a very early stage, and is not fully implemented yet, Stuff will be added over time but we are unsure
// when it will be used in development, but it will be used in the future (hopefully)

class User {
  Token: string;
  Failed: boolean;
  FailedCode: number | null;
  res: Response<any, Record<string, any>> | undefined;
  req: Request<any, any, any, any> | undefined;
  user: LessUser | undefined;
  constructor(Token: string, req?: Request, res?: Response) {
    this.Token = Token;

    this.Failed = false;

    this.FailedCode = null;

    this.req = req;

    this.res = res;

    this.user = req?.user;
  }

  SetFailed(code: number) {
    this.Failed = true;
    this.FailedCode = code;
  }

  reply(code: number, data: any) {
    if (typeof data === "object") {
      this.res?.status(code).json(data);
    } else {
      this.res?.status(code).send(data);
    }
  }

  async fetchFriends(FilterBlocked = false) {
    const FriendsR = await FriendSchema.find({
      Receiver: Encryption.encrypt(this.user?.id as string),
    });

    const FriendsS = await FriendSchema.find({
      Sender: Encryption.encrypt(this.user?.id as string),
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

      await Friend.populate<PopulatedUserWJ>("Sender");
      await Friend.populate<PopulatedUserWJ>("Receiver");

      const FixedData = schemaData("Friend", {
        Sender: Encryption.completeDecryption(
          (Friend.Sender as any as PopulatedUserWJ).toJSON()
        ),
        Receiver: Encryption.completeDecryption(
          (Friend.Receiver as any as PopulatedUserWJ).toJSON()
        ),
        Flags: Friend.Flags,
      });

      FriendRArray.push(FixedData);
    }

    for (const Friend of FriendsS) {
      if (FilterBlocked && Friend.Flags === RelationshipFlags.Blocked) continue;
      
      await Friend.populate<PopulatedUserWJ>("Sender");
      await Friend.populate<PopulatedUserWJ>("Receiver");

      const FixedData = schemaData("Friend", {
        Sender: Encryption.completeDecryption(
          (Friend.Sender as any as PopulatedUserWJ).toJSON()
        ),
        Receiver: Encryption.completeDecryption(
          (Friend.Receiver as any as PopulatedUserWJ).toJSON()
        ),
        Flags: Friend.Flags,
      });

      FriendSArray.push(FixedData);
    }

    return [...FriendRArray, ...FriendSArray];
  }
}

export default User;

export { User };
