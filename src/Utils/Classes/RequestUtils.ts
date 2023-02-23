import type { Request, Response } from "express";
import type { Channel } from "../../Types/Guilds/Channel";
import type { Guild } from "../../Types/Guilds/Guild";
import type { GuildMember } from "../../Types/Guilds/GuildMember";
import type { Role } from "../../Types/Guilds/Role";
import type { RawUser } from "../../Types/Users/Users";

import { ChannelSchema, GuildMemberSchema, GuildSchema, RoleSchema, UserSchema } from "../Schemas/Schemas";
import Encryption from "./Encryption";

class RequestUtils {
    req: Request<any, any, any, any>;
    res: Response<any, Record<string, any>>;
    constructor(req: Request, res: Response) {

        this.req = req;

        this.res = res;
    }

    async FetchUser(Id: string): Promise<RawUser | null> {
        const UserData = await UserSchema.findById(Encryption.encrypt(Id));

        if (!UserData) return null;

        return Encryption.completeDecryption(UserData.toObject())
    }

    async FetchMember(GuildId: string, UserId: string): Promise<GuildMember | null> {
        const GuildMemberData = await GuildMemberSchema.findOne({
            Guild: Encryption.encrypt(GuildId),
            User: Encryption.encrypt(UserId)
        });

        if (!GuildMemberData) return null;

        return Encryption.completeDecryption(GuildMemberData.toObject())
    }

    async FetchGuild(Id: string): Promise<Guild | null> {
        const GuildData = await GuildSchema.findById(Encryption.encrypt(Id));

        if (!GuildData) return null;

        return Encryption.completeDecryption(GuildData.toObject())
    }

    async FetchChannel(Id: string): Promise<Channel | null> {
        const ChannelData = await ChannelSchema.findById(Encryption.encrypt(Id));

        if (!ChannelData) return null;

        return Encryption.completeDecryption(ChannelData.toObject())
    }

    async FetchRole(Id: string): Promise<Role | null> {
        const RoleData = await RoleSchema.findById(Encryption.encrypt(Id));

        if (!RoleData) return null;

        return Encryption.completeDecryption(RoleData.toObject())
    }
}

export default RequestUtils;

export { RequestUtils };