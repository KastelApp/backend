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

import type { Request, Response } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { Permissions as Perms } from '../../../Constants.js';
import { RelationshipFlags } from '../../../Constants.js';
import type { GuildPermissions } from '../../../Types/Guilds/User';
import type { LessUser, PopulatedUserWJ } from '../../../Types/Users/Users';
import schemaData from '../../SchemaData.js';
import { FriendSchema, SettingSchema, UserSchema } from '../../Schemas/Schemas.js';
import GuildMemberFlags from '../BitFields/GuildMember.js';
import Permissions from '../BitFields/Permissions.js';
import Encryption from '../Encryption.js';
import type Utils from './Utils';

// Description: This class is used to store user data, and to flush it to the database
// Its main purpose is for setting when someone fails a request, we then flush it to the rate limiter database
// this way our rate limiter can be dynamic and not just a static number
// failed_requests % 5 === 0 ? failed_requests / 5 : failed_requests % 5 (Example formula)
// Do note this is in a very early stage, and is not fully implemented yet, Stuff will be added over time but we are unsure
// when it will be used in development, but it will be used in the future (hopefully)

class UserUtils {
	public Token: string;

	public Failed: boolean;

	public FailedCode: number | null;

	public req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>;

	public res: Response<any, Record<string, any>>;

	public user: LessUser;

	public Utils: Utils;

	public constructor(
		Token: string,
		req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
		res: Response<any, Record<string, any>>,
		Utils: Utils,
	) {
		this.Token = Token;

		this.Failed = false;

		this.FailedCode = null;

		this.req = req;

		this.res = res;

		this.user = req.user;

		this.Utils = Utils;
	}

	public SetFailed(code: number) {
		this.Failed = true;
		this.FailedCode = code;
	}

	public reply(code: number, data: any) {
		if (typeof data === 'object') {
			this.res.status(code).json(data);
		} else {
			this.res.status(code).send(data);
		}
	}

	public async fetchFriends(FilterBlocked = false) {
		const FriendsR = await FriendSchema.find({
			Receiver: Encryption.encrypt(this.user.Id as string),
		});

		const FriendsS = await FriendSchema.find({
			Sender: Encryption.encrypt(this.user.Id as string),
		});

		const FriendRArray: {
			Flags: number;
			Receiver: PopulatedUserWJ;
			Sender: PopulatedUserWJ;
		}[] = [];

		const FriendSArray: {
			Flags: number;
			Receiver: PopulatedUserWJ;
			Sender: PopulatedUserWJ;
		}[] = [];

		for (const Friend of FriendsR) {
			if (FilterBlocked && Friend.Flags === RelationshipFlags.Blocked) continue;

			const PopulatedFriend = await Friend.populate<{
				Receiver: PopulatedUserWJ;
				Sender: PopulatedUserWJ;
			}>(['Receiver', 'Sender']);

			const FixedData = schemaData('Friend', {
				Sender: Encryption.completeDecryption(PopulatedFriend.toJSON()),
				Receiver: Encryption.completeDecryption(PopulatedFriend.toJSON()),
				Flags: Friend.Flags,
			});

			FriendRArray.push(FixedData);
		}

		for (const Friend of FriendsS) {
			if (FilterBlocked && Friend.Flags === RelationshipFlags.Blocked) continue;

			const PopulatedFriend = await Friend.populate<{
				Receiver: PopulatedUserWJ;
				Sender: PopulatedUserWJ;
			}>(['Receiver', 'Sender']);

			const FixedData = schemaData('Friend', {
				Sender: Encryption.completeDecryption(PopulatedFriend.toJSON()),
				Receiver: Encryption.completeDecryption(PopulatedFriend.toJSON()),
				Flags: Friend.Flags,
			});

			FriendSArray.push(FixedData);
		}

		return [...FriendRArray, ...FriendSArray];
	}

	// This is for Guilds not DM channels
	public async canSendMessagesGuildV(ChannelId: string): Promise<boolean> {
		const Guilds = await this.getGuilds(['Channels', 'Members', 'MemberUser', 'PermissionOverides', 'Roles']);

		const Guild = Guilds?.find((gld) => gld.Channels?.find((chan) => chan._id === ChannelId));

		if (!Guild) return false;

		const GuildMember = Guild.Members?.find((mem) => mem?.User?._id === this.user?.Id);

		if (!GuildMember) return false;

		const MemberFlags = new GuildMemberFlags(Number(GuildMember.Flags));

		if (!MemberFlags.hasString('In')) return false;

		if (MemberFlags.hasString('Owner') || MemberFlags.hasString('CoOwner')) return true;

		// Soon we will check for PermissionOverides
		const Channel = Guild.Channels?.find((chan) => chan._id === ChannelId);

		if (!Channel) return false;

		const OneRoleHasPermission = GuildMember.Roles.some((rle) => {
			const Role = Guild.Roles?.find((gr) => gr._id === rle);

			if (!Role) return false;

			const RolePermissions = new Permissions(Number(Role.Permissions));

			return RolePermissions.hasString('SendMessages');
		});

		return OneRoleHasPermission ?? false;
	}

	public async getGuilds(
		include: ('Channels' | 'Members' | 'MemberUser' | 'PermissionOverides' | 'Roles')[],
	): Promise<GuildPermissions[]> {
		const UserSchemad = await UserSchema.findById(Encryption.encrypt(this.user.Id as string));

		if (!UserSchemad) return [];

		await UserSchemad.populate('Guilds');

		// await UserSchemad.populate([
		//   "Guilds.Members",
		//   "Guilds.Roles",
		//   "Guilds.Channels",
		// ]);

		// await UserSchemad.populate([
		//   "Guilds.Members.User",
		//   "Guilds.Channels.PermissionsOverides",
		// ]);

		const FirstPopulate = [];
		const SecondPopulate = [];

		if (include.includes('Members')) FirstPopulate.push('Guilds.Members');
		if (include.includes('Roles')) FirstPopulate.push('Guilds.Roles');
		if (include.includes('Channels')) FirstPopulate.push('Guilds.Channels');

		if (include.includes('MemberUser')) SecondPopulate.push('Guilds.Members.User');
		if (include.includes('PermissionOverides')) SecondPopulate.push('Guilds.Channels.PermissionsOverides');

		if (FirstPopulate.length > 0) await UserSchemad.populate(FirstPopulate);
		if (SecondPopulate.length > 0) await UserSchemad.populate(SecondPopulate);

		return Encryption.completeDecryption(UserSchemad.toObject().Guilds);
	}

	public async getMember(GuildId: string, UserId: string) {
		const Guild = await this.getGuilds(['Members', 'MemberUser']);

		const GuildData = Guild.find((gld) => gld._id === GuildId);

		if (!GuildData) return null;

		const Member = GuildData.Members?.find((mem) => mem.User?._id === UserId);

		if (!Member) return null;

		return Member;
	}

	public async getMemberFromChannel(ChannelId: string, UserId: string) {
		const Guild = await this.getGuilds(['Channels', 'Members', 'MemberUser']);

		const GuildData = Guild.find((gld) => gld.Channels?.find((chan) => chan._id === ChannelId));

		if (!GuildData) return null;

		const Member = GuildData.Members?.find((mem) => mem.User?._id === UserId);

		if (!Member) return null;

		return Member;
	}

	public async getSessions(): Promise<
		{
			CreatedDate: Date;
			Ip: string;
			Token: string;
		}[]
	> {
		const Settings = await SettingSchema.findOne({
			User: Encryption.encrypt(this.user.Id as string),
		});

		if (!Settings) return [];

		return Encryption.completeDecryption(
			Settings.toJSON().Tokens.map((ses) => {
				return {
					Token: ses.Token,
					CreatedDate: ses.CreatedDate,
					Ip: ses.Ip,
				};
			}),
		);
	}

	// TODO: Check for PermissionOverides
	public async hasPermission(
		GuildId: string,
		Permission: (keyof typeof Perms)[] | keyof typeof Perms,
		Single?: boolean, // If Permission is an Array Single will return true if the role has at least one of the permissions
	): Promise<boolean> {
		const Guilds = await this.getGuilds(['Channels', 'Members', 'MemberUser', 'PermissionOverides', 'Roles']);

		const Guild = Guilds.find((gld) => gld._id === GuildId);

		if (!Guild) return false;

		const GuildMember = Guild?.Members?.find((mem) => mem.User?._id === this.user?.Id);

		if (!GuildMember) return false;

		const MemberFlags = new GuildMemberFlags(Number(GuildMember.Flags));

		if (!MemberFlags.hasString('In')) return false;

		if (MemberFlags.hasString('Owner') || MemberFlags.hasString('CoOwner')) return true;

		const OneRoleHasPermission = GuildMember.Roles.some((rl) => {
			const Role = Guild?.Roles?.find((gr) => gr._id === rl);

			if (!Role) return false;

			const RolePermissions = new Permissions(Number(Role.Permissions));

			if (Array.isArray(Permission)) {
				if (Single) {
					return Permission.some((pm) => RolePermissions.hasString(pm));
				} else {
					return Permission.every((pm) => RolePermissions.hasString(pm));
				}
			}

			return RolePermissions.hasString(Permission);
		});

		return OneRoleHasPermission ?? false;
	}
}

export default UserUtils;

export { UserUtils as User };
