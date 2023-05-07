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
import { MessageFlags } from '../../../Constants.js';
import type { PopulatedMessage } from '../../../Types/Guilds/Message';
import type { LessUser } from '../../../Types/Users/Users';
// import Encryption from "../Encryption";
import schemaData from '../../SchemaData.js';
import { ChannelSchema, MessageSchema } from '../../Schemas/Schemas.js';
import GuildMemberFlags from '../BitFields/GuildMember.js';
import Permissions from '../BitFields/Permissions.js';
import Encryption from '../Encryption.js';
import type Utils from './Utils';

// Description: This is a class for Managing stuff Channel related
// sending new messages, editing messages, deleting messages, etc

class ChannelUtils {
	public Token: string;

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

		this.req = req;

		this.res = res;

		this.user = req.user;

		this.Utils = Utils;
	}

	public async fetchChannelStuff(ChannelId: string) {
		const Guilds = await this.Utils.User.getGuilds(['Channels', 'Members', 'MemberUser']);

		const Guild = Guilds.find((gld) => gld.Channels?.find((channel) => channel._id === ChannelId));

		if (!Guild)
			return {
				Guild: null,
				Channel: null,
				GuildMember: null,
			};

		const GuildMember = Guild.Members?.find((mem) => mem.User?._id === this.user?.Id);

		if (!GuildMember)
			return {
				Guild: null,
				Channel: null,
				GuildMember: null,
			};

		const Channel = Guild.Channels?.find((chan) => chan._id === ChannelId);

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
	public async hasPermission(
		ChannelId: string,
		Permission: (keyof typeof Perms)[] | keyof typeof Perms,
		Single?: boolean, // If Permission is an Array Single will return true if the role has at least one of the permissions
	): Promise<boolean> {
		const { Guild, Channel, GuildMember } = await this.fetchChannelStuff(ChannelId);

		if (!Guild || !Channel || !GuildMember) return false;

		const MemberFlags = new GuildMemberFlags(Number(GuildMember.Flags));

		if (!MemberFlags.hasString('In')) return false;

		if (MemberFlags.hasString('Owner') || MemberFlags.hasString('CoOwner')) return true;

		const OneRoleHasPermission = GuildMember.Roles.some((rol) => {
			const Role = Guild.Roles?.find((gr) => gr._id === rol);

			if (!Role) return false;

			const RolePermissions = new Permissions(Number(Role.Permissions));

			if (Array.isArray(Permission)) {
				if (Single) {
					return Permission.some((perm) => RolePermissions.hasString(perm));
				} else {
					return Permission.every((perm) => RolePermissions.hasString(perm));
				}
			}

			return RolePermissions.hasString(Permission);
		});

		return OneRoleHasPermission ?? false;
	}

	// This is for Guilds not DM channels
	public async canSendMessage(ChannelId: string): Promise<boolean> {
		const { Guild, Channel, GuildMember } = await this.fetchChannelStuff(ChannelId);

		if (!Guild || !Channel || !GuildMember) return false;

		const MemberFlags = new GuildMemberFlags(Number(GuildMember.Flags));

		if (!MemberFlags.hasString('In')) return false;

		if (MemberFlags.hasString('Owner') || MemberFlags.hasString('CoOwner')) return true;

		const OneRoleHasPermission = GuildMember.Roles.some((rol) => {
			const Role = Guild.Roles?.find((gr) => gr._id === rol);

			if (!Role) return false;

			const RolePermissions = new Permissions(Number(Role.Permissions));

			return RolePermissions.hasString('SendMessages');
		});

		return OneRoleHasPermission ?? false;
	}

	public async getMember(ChannelId: string, UserId: string) {
		const Guild = await this.Utils.User.getGuilds(['Channels', 'Members', 'MemberUser']);

		const GuildData = Guild.find((gld) => gld.Channels?.find((chan) => chan._id === ChannelId));

		if (!GuildData) return null;

		const Member = GuildData.Members?.find((mem) => mem.User?._id === UserId);

		if (!Member) return null;

		return Member;
	}

	public async fetchMessages(
		ChannelId: string,
		Limit: number = 50,
		Before?: string,
		After?: string,
	): Promise<PopulatedMessage[]> {
		const BeforeDate = Before ? this.req.app.snowflake.TimeStamp(Before) : null;
		const AfterDate = After ? this.req.app.snowflake.TimeStamp(After) : null;

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
			await Message.populate('Author');

			await Message.populate('Author.User');

			Messages.push(Message.toJSON());
		}

		const Schemad = schemaData('Messages', Messages);

		return Encryption.completeDecryption(Schemad);
	}

	public async fetchMessage(ChannelId: string, MessageId: string): Promise<PopulatedMessage | null> {
		const Message = await MessageSchema.findOne({
			Channel: Encryption.encrypt(ChannelId),
			_id: Encryption.encrypt(MessageId),
		});

		if (!Message) return null;

		await Message.populate('Author');

		await Message.populate('Author.User');

		const Schemad = schemaData('Message', Message.toJSON());

		return Encryption.completeDecryption(Schemad);
	}

	public async deleteMessages(ChannelId: string, MessageIds: string[]): Promise<boolean> {
		await MessageSchema.deleteMany({
			Channel: Encryption.encrypt(ChannelId),
			_id: {
				$in: Encryption.completeEncryption(MessageIds),
			},
		});

		return true;
	}

	public async editMessage(
		ChannelId: string,
		MessageId: string,
		Content: string,
		AllowedMentions: number,
		Flags?: number,
	): Promise<PopulatedMessage | null> {
		await MessageSchema.updateOne({
			Channel: Encryption.encrypt(ChannelId),
			...(Content ? { Content: Encryption.encrypt(Content) } : {}),
			...(AllowedMentions ? { AllowedMentions } : {}),
			UpdatedDate: Date.now(),
		});

		const Message = await MessageSchema.findOne({
			_id: Encryption.encrypt(MessageId),
			Channel: Encryption.encrypt(ChannelId),
			...(Flags ? { Flags } : {}),
		});

		if (!Message) return null;

		await Message.populate('Author');

		await Message.populate('Author.User');

		const Schemad = schemaData('Message', Message.toJSON());

		return Encryption.completeDecryption(Schemad);
	}

	public async createMessage(
		ChannelId: string,
		MessageId: string,
		AuthorId: string,
		Content: string,
		Nonce: string,
		AllowedMentions: number,
		Flags: number,
		ReplyingTo?: string,
	): Promise<PopulatedMessage | null> {
		const Message = await MessageSchema.create({
			_id: Encryption.encrypt(MessageId),
			Channel: Encryption.encrypt(ChannelId),
			Author: Encryption.encrypt(AuthorId),
			Content: Encryption.encrypt(Content),
			Nonce: Encryption.encrypt(Nonce),
			CreatedDate: Date.now(),
			Flags: ReplyingTo ? MessageFlags.Reply | Flags : Flags | MessageFlags.Normal,
			ReplyingTo: ReplyingTo ? Encryption.encrypt(ReplyingTo) : null,
			AllowedMentions,
		});

		await Message.populate('Author');

		await Message.populate('Author.User');

		const Schemad = schemaData('Message', Message.toJSON());

		return Encryption.completeDecryption(Schemad);
	}

	public async deleteChannel(ChannelId: string): Promise<boolean> {
		const ChannelDeleted = await ChannelSchema.deleteOne({
			_id: Encryption.encrypt(ChannelId),
		});

		return ChannelDeleted.deletedCount !== 0;
	}
}

export default ChannelUtils;

export { ChannelUtils };
