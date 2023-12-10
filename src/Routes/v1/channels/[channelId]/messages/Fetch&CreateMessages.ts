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

import type { Request, Response } from "express";
import { GuildMemberFlags } from "../../../../../Constants.ts";
import Channel from "../../../../../Middleware/Channel.ts";
import User from "../../../../../Middleware/User.ts";
import type App from "../../../../../Utils/Classes/App";
import { FlagUtils } from "../../../../../Utils/Classes/BitFields/NewFlags.ts";
import Encryption from "../../../../../Utils/Classes/Encryption.ts";
import ErrorGen from "../../../../../Utils/Classes/ErrorGen.ts";
import Route from "../../../../../Utils/Classes/Route.ts";
import type { MainObject } from "../../../../../Utils/Cql/Types/Message.ts";
import type Messages from "../../../../../Utils/Cql/Types/Message.ts";
import type PermissionsOverrides from "../../../../../Utils/Cql/Types/PermissionsOverides.ts";
import type Roles from "../../../../../Utils/Cql/Types/Role.ts";
import { T } from "../../../../../Utils/TypeCheck.ts";
import { FetchMentions } from "../../../../../Utils/Versioning/v1/FetchMentions.ts";
import PermissionHandler from "../../../../../Utils/Versioning/v1/PermissionCheck.ts";
import { ValidateEmbed } from "../../../../../Utils/Versioning/v1/ValidateEmbed.ts";

interface Message {
	AllowedMentions: number;
	Attachments: string[];
	Content: string;
	Embeds: MainObject[];
	Flags: number;
	Nonce: string;
	ReplyingTo: string;
}

// darkerink: Some stuff is scuffed, this project is obv in alpha, so issues are to be expected
// currently nonce doesn't work
export default class FetchAndCreateMessages extends Route {
	public constructor(App: App) {
		super(App);

		this.Methods = ["GET", "POST"];

		this.Middleware = [
			User({
				AccessType: "LoggedIn",
				AllowedRequesters: "User",
				App,
			}),
			Channel({
				App,
				Required: true,
			}),
		];

		this.AllowedContentTypes = ["application/json"];

		this.Routes = ["/"];
	}

	public override async Request(Req: Request<{ channelId: string }, any, any, { after: string, before: string, limit: string }>, Res: Response): Promise<void> {
		switch (Req.methodi) {
			case "GET": {
				await this.FetchMessagesGet(Req, Res);

				break;
			}

			case "POST": {
				await this.CreateMessagePost(Req, Res);

				break;
			}

			default: {
				Req.fourohfourit();

				break;
			}
		}
	}

	private async FetchMessagesGet(Req: Request<{ channelId: string }, any, any, { after: string, before: string, limit: string }>, Res: Response): Promise<void> {
		const InvalidRequest = ErrorGen.InvalidField();

		const Member = await this.FetchMember(Req.user.Id, (await this.FetchGuildId(Req.params.channelId)) ?? "");

		if (!Member) return; // will never happen

		const FoundRoles = await this.FetchRoles(Member.Roles);
		const FoundChannel = await this.FetchChannel(Req.params.channelId);

		if (!FoundChannel) return; // will never happen

		const FetchedPermissions = await this.FetchPermissionOverides(FoundChannel.PermissionsOverrides ?? []);

		const MemberFlags = new FlagUtils<typeof GuildMemberFlags>(Member.Flags, GuildMemberFlags);
		const PermissionCheck = new PermissionHandler(
			Req.user.Id,
			MemberFlags.cleaned,
			FoundRoles.map((role) => {
				return {
					Id: role.RoleId,
					Permissions: role.Permissions.toString(),
					Position: role.Position,
				};
			}),
			[
				{
					Id: FoundChannel.ChannelId,
					Overrides: FetchedPermissions.map((Permission) => {
						return {
							Allow: Permission.Allow.toString(),
							Deny: Permission.Deny.toString(),
							Id: Permission.Id,
							Type: Permission.Type === this.App.Constants.PermissionOverrideTypes.Role ? "Role" : "Member",
						};
					}),
				},
			],
		);
		
		if (!PermissionCheck.HasChannelPermission(Req.params.channelId, "ReadMessages")) {
			InvalidRequest.AddError({
				Permissions: {
					Code: "MissingPermissions",
					Message: "You are missing the SendMessages permission",
				},
			});
		}


		if (Object.keys(InvalidRequest.Errors).length > 0) {
			Res.status(400).send(InvalidRequest.toJSON());

			return;
		}

		let query = "SELECT * FROM messages WHERE channel_id = ? ";
		const params = [
			Encryption.Encrypt(Req.params.channelId)
		];
		
		if (Req.query.after) {
			query += "AND message_id > ? ";
			params.push(Encryption.Encrypt(Req.query.after));
		}
		
		if (Req.query.before) {
			query += "AND message_id < ? ";
			params.push(Encryption.Encrypt(Req.query.before));
		}
		
		query += "ORDER BY message_id DESC ";
		
		if (Number.isNaN(Number(Req.query.limit))) {
			params.push("50");
		} else {
			params.push(String(Number(Req.query.limit)));
		}
		
		query += "LIMIT ? ";
		
		const Messages = await this.App.Cassandra.Client.execute(
			query,
			params,
			{
				prepare: true,
				
			}
		);
		
		const MappedMessages = Messages.rows.map((Msg) => {
			return {
				ChannelId: Msg.channel_id,
				MessageId: Msg.message_id.toString(),
				AllowedMentions: Msg.allowed_mentions,
				Content: Msg.content,
				Embeds: this.App.Cassandra.UnderScoreCqlToPascalCaseMappings.objectToFixedCasing(Msg.embeds ?? []),
				Flags: Msg.flags,
				MentionChannels: Msg.mention_channels ?? [],
				MentionRoles: Msg.mention_roles ?? [],
				Mentions: Msg.mentions ?? [],
				Nonce: Msg.nonce,
				ReplyingTo: Msg.replying_to,
				UpdatedDate: Msg.updated_date,
				Attachments: Msg.attachments ?? [],
				AuthorId: Msg.author_id
			}
		});
		
		const NewMessages = [];
		
		for (const Message of MappedMessages) {
			const Member = await this.FetchMember(Encryption.Decrypt(Message.AuthorId), (await this.FetchGuildId(Req.params.channelId)) ?? "");
			
			if (!Member) continue; // will never happen
			
			const UserData = await this.App.Cassandra.Models.User.get(
				{
					UserId: Message.AuthorId,
				},
				{
					fields: ["avatar", "tag", "avatar", "username", "flags", "public_flags"],
				},
			);
			
			if (!UserData) continue; // will never happen
			
			const DataToSend = {
				AllowedMentions: Message.AllowedMentions,
				Attachments: Message.Attachments,
				Author: {
					Avatar: UserData.Avatar,
					Bot: false,
					Tag: UserData.Tag,
					Id: Encryption.Decrypt(Message.AuthorId),
					Username: UserData.Username,
					PublicFlags: String(UserData.PublicFlags),
					Flags: String(UserData.Flags),
					Roles: Member.Roles,
					JoinedAt: Member.JoinedAt,
				},
				Content: Message.Content,
				Embeds: Message.Embeds,
				Flags: Message.Flags,
				Mentions: {
					Channels: Message.MentionChannels,
					Roles: Message.MentionRoles,
					Users: Message.Mentions,
				},
				Id: Message.MessageId,
				Nonce: Message.Nonce,
				ReplyingTo: Message.ReplyingTo
			}
			
			NewMessages.push(this.FixObject(DataToSend));
		}

		Res.send(Encryption.CompleteDecryption(NewMessages));
	}

	private async CreateMessagePost(Req: Request<{ channelId: string }, any, Message>, Res: Response): Promise<void> {
		const {
			AllowedMentions,
			// Attachments,
			Content,
			Embeds,
			Flags,
			Nonce,
			ReplyingTo,
		} = Req.body;

		const InvalidRequest = ErrorGen.InvalidField();

		const Member = await this.FetchMember(Req.user.Id, (await this.FetchGuildId(Req.params.channelId)) ?? "");

		if (!Member) return; // will never happen

		const FoundRoles = await this.FetchRoles(Member.Roles);
		const FoundChannel = await this.FetchChannel(Req.params.channelId);

		if (!FoundChannel) return; // will never happen

		const FetchedPermissions = await this.FetchPermissionOverides(FoundChannel.PermissionsOverrides ?? []);

		const MemberFlags = new FlagUtils<typeof GuildMemberFlags>(Member.Flags, GuildMemberFlags);
		const PermissionCheck = new PermissionHandler(
			Req.user.Id,
			MemberFlags.cleaned,
			FoundRoles.map((role) => {
				return {
					Id: role.RoleId,
					Permissions: role.Permissions.toString(),
					Position: role.Position,
				};
			}),
			[
				{
					Id: FoundChannel.ChannelId,
					Overrides: FetchedPermissions.map((Permission) => {
						return {
							Allow: Permission.Allow.toString(),
							Deny: Permission.Deny.toString(),
							Id: Permission.Id,
							Type: Permission.Type === this.App.Constants.PermissionOverrideTypes.Role ? "Role" : "Member",
						};
					}),
				},
			],
		);

		if (!PermissionCheck.HasChannelPermission(Req.params.channelId, "SendMessages")) {
			InvalidRequest.AddError({
				Permissions: {
					Code: "MissingPermissions",
					Message: "You are missing the SendMessages permission",
				},
			});
		}

		if (AllowedMentions && !T(AllowedMentions, "number")) {
			InvalidRequest.AddError({
				AllowedMentions: {
					Code: "InvalidAllowedMentions",
					Message: "AllowedMentions is not a number",
				},
			});
		}

		if ((!T(Content, "string") && !Embeds) || Embeds?.length === 0) {
			InvalidRequest.AddError({
				Content: {
					Code: "InvalidMessage",
					Message: "You cannot send an empty message",
				},
			});
		}

		if (Flags && !T(Flags, "number")) {
			InvalidRequest.AddError({
				Flags: {
					Code: "InvalidFlags",
					Message: "Flags is not a number",
				},
			});
		}

		if (Nonce && (!T(Nonce, "string") || !this.App.Snowflake.Validate(Nonce))) {
			InvalidRequest.AddError({
				Nonce: {
					Code: "InvalidNonce",
					Message: "Nonce is not a valid snowflake",
				},
			});
		}

		if (ReplyingTo && (!T(ReplyingTo, "string") || !this.App.Snowflake.Validate(ReplyingTo))) {
			InvalidRequest.AddError({
				ReplyingTo: {
					Code: "InvalidReplyingTo",
					Message: "ReplyingTo is not a valid snowflake",
				},
			});
		}

		if (Embeds) {
			const Errors: {
				Errors: {
					[error: string]:
						| {
								[error: string]: {
									Code: string;
									Message: string;
								};
						  }
						| {
								Code: string;
								Message: string;
						  };
				};
				Index: number;
			}[] = [];

			for (const Embed of Embeds) {
				const ValidatedEmbed = ValidateEmbed(Embed);

				if (!ValidatedEmbed.Valid) {
					const Error: {
						Errors: {
							[error: string]:
								| {
										[error: string]: {
											Code: string;
											Message: string;
										};
								  }
								| {
										Code: string;
										Message: string;
								  };
						};
						Index: number;
					} = {
						Index: Embeds.indexOf(Embed),
						Errors: {},
					};

					for (const EmbedError of ValidatedEmbed.Error) {
						if (EmbedError.Field.includes(".")) {
							const [Field, SubField] = EmbedError.Field.split(".");

							if (!Field || !SubField) continue;

							if (!Error.Errors[Field]) {
								Error.Errors[Field] = {
									Code: "",
									Message: "",
								};
							}

							// @ts-expect-error -- Too lazy to fix
							Error.Errors[Field][SubField] = {
								Code: EmbedError.Code,
								Message: EmbedError.Message,
							};
						} else {
							Error.Errors[EmbedError.Field] = {
								Code: EmbedError.Code,
								Message: EmbedError.Message,
							};
						}
					}

					Errors.push(Error);
				}
			}

			if (Errors.length > 0) {
				InvalidRequest.AddError({
					Embeds: Errors.map((Error) => ({
						[Error.Index]: Error.Errors,
					})).reduce((acc, cur) => {
						return {
							...acc,
							...cur,
						};
					}),
				});
			}
		}

		if (Flags !== this.App.Constants.MessageFlags.Normal) {
			InvalidRequest.AddError({
				Flags: {
					Code: "InvalidFlags",
					Message: "Flags is not a valid flag",
				},
			});
		}
		
		if (ReplyingTo) {
			const FetchedMessage = await this.App.Cassandra.Models.Message.get(
				{
					ChannelId: Encryption.Encrypt(Req.params.channelId),
					// @ts-expect-error -- todo: fix this
					MessageId: ReplyingTo,
				},
				{
					fields: ["message_id"],
				},
			);
			
			if (!FetchedMessage) {
				InvalidRequest.AddError({
					ReplyingTo: {
						Code: "InvalidReplyingTo",
						Message: "ReplyingTo is not a valid message",
					},
				});
			}
		}

		if (Object.keys(InvalidRequest.Errors).length > 0) {
			Res.status(400).send(InvalidRequest.toJSON());

			return;
		}
		
		const UserData = await this.App.Cassandra.Models.User.get(
			{
				UserId: Encryption.Encrypt(Req.user.Id),
			},
			{
				fields: ["avatar", "tag", "avatar", "username"],
			},
		);

		if (!UserData) return; // will never happen

		if (Nonce) {
			const FetchedMessage = await this.App.Cassandra.Models.Message.get(
				{
					ChannelId: Encryption.Encrypt(Req.params.channelId),
					Nonce: Encryption.Encrypt(Nonce),
				},
				{
					allowFiltering: true,
				},
			);

			if (FetchedMessage) {
				const ObjToSend = { // just like if you were to fetch this message
					AllowedMentions: FetchedMessage.AllowedMentions,
					Attachments: FetchedMessage.Attachments ?? [],
					Author: {
						Avatar: UserData?.Avatar,
						Bot: Req.user.Bot,
						Tag: UserData?.Tag,
						Id: Req.user.Id,
						Username: UserData?.Username,
						PublicFlags: String(Req.user.FlagsUtil.PublicFlags.cleaned),
						Flags: String(Req.user.FlagsUtil.PublicPrivateFlags),
						Roles: Member.Roles,
						JoinedAt: Member.JoinedAt,
					},
					Content: FetchedMessage.Content,
					Embeds: this.App.Cassandra.UnderScoreCqlToPascalCaseMappings.objectToFixedCasing(FetchedMessage.Embeds ?? []),
					Flags: FetchedMessage.Flags,
					Mentions: {
						Channels: FetchedMessage.MentionChannels ?? [],
						Roles: FetchedMessage.MentionRoles ?? [],
						Users: FetchedMessage.Mentions ?? [],
					},
					Id: FetchedMessage.MessageId.toString(),
					Nonce: FetchedMessage.Nonce,
					ReplyingTo: FetchedMessage.ReplyingTo
				};

				Res.status(200).send(this.FixObject(Encryption.CompleteDecryption(ObjToSend)));
				
				return;
			}
		}

		const MessageId = this.App.Snowflake.Generate();
		const { Channels, Roles, Users } = FetchMentions(Content ?? "");

		const BuiltMessage: Partial<Messages> = {
			AllowedMentions: AllowedMentions ?? 0,
			Attachments: [],
			AuthorId: Encryption.Encrypt(Req.user.Id),
			ChannelId: Encryption.Encrypt(Req.params.channelId),
			Content: Content ? Encryption.Encrypt(Content) : "",
			Embeds: Embeds ? Encryption.CompleteEncryption(Embeds) : [],
			Flags: Flags ?? this.App.Constants.MessageFlags.Normal,
			MentionChannels: Channels.map((Channel) => Encryption.Encrypt(Channel)),
			MentionRoles: Roles.map((Role) => Encryption.Encrypt(Role)),
			Mentions: Users.map((User) => Encryption.Encrypt(User)),
			// @ts-expect-error -- todo: fix this
			MessageId, // darkerink: I want to encrypt this, but idk how to query messages then, since with this way we can sort by the message id size
			Nonce: Nonce ? Encryption.Encrypt(Nonce) : "",
			ReplyingTo: ReplyingTo ? Encryption.Encrypt(ReplyingTo) : ""
		};

		await this.App.Cassandra.Models.Message.insert(BuiltMessage as Messages);
		
		
		const DataToSend = {
			AllowedMentions: BuiltMessage.AllowedMentions as number,
			Attachments: BuiltMessage.Attachments as string[],
			Author: {
				Avatar: UserData.Avatar,
				Bot: Req.user.Bot,
				Tag: UserData.Tag,
				Id: Req.user.Id,
				Username: UserData.Username,
				PublicFlags: String(Req.user.FlagsUtil.PublicFlags.cleaned),
				Flags: String(Req.user.FlagsUtil.PublicPrivateFlags),
				Roles: Member.Roles,
				JoinedAt: Member.JoinedAt,
			},
			Content: Content ?? "",
			Embeds: Embeds ?? [],
			Flags: Number(BuiltMessage.Flags),
			Mentions: {
				Channels: BuiltMessage.MentionChannels as string[],
				Roles: BuiltMessage.MentionRoles as string[],
				Users: BuiltMessage.Mentions as string[],
			},
			Id: MessageId.toString(),
			Nonce: Nonce ?? null,
			ReplyingTo: ReplyingTo ?? null
		}
		
		this.App.SystemSocket.Events.MessageCreate(DataToSend);
		
		Res.status(201).send(this.FixObject(Encryption.CompleteDecryption(DataToSend)));
	}

	private async FetchMember(UserId: string, GuildId: string) {
		const Member = await this.App.Cassandra.Models.GuildMember.get(
			{
				UserId: Encryption.Encrypt(UserId),
				GuildId: Encryption.Encrypt(GuildId),
			},
			{
				allowFiltering: true,
			},
		);

		if (!Member) return null;

		return Encryption.CompleteDecryption(Member);
	}

	private async FetchRoles(Roles: string[]) {
		const RolePromises = [];

		for (const RoleId of Roles) {
			RolePromises.push(
				this.App.Cassandra.Models.Role.get({
					RoleId: Encryption.Encrypt(RoleId),
				}),
			);
		}

		const FetchedRoles = await Promise.all(RolePromises);

		const NonNullRoles: Roles[] = [];

		for (const Role of FetchedRoles) {
			if (Role) NonNullRoles.push(Role);
		}

		return NonNullRoles.map((Role) => Encryption.CompleteDecryption(Role));
	}

	private async FetchChannel(ChannelId: string) {
		const Channel = await this.App.Cassandra.Models.Channel.get({
			ChannelId: Encryption.Encrypt(ChannelId),
		});

		if (!Channel) return null;

		return Encryption.CompleteDecryption(Channel);
	}

	private async FetchPermissionOverides(PermissionOverrides: string[]) {
		const PermissionOveridePromises = [];

		for (const PermissionOverideId of PermissionOverrides) {
			PermissionOveridePromises.push(
				this.App.Cassandra.Models.PermissionOverride.get({
					PermissionId: Encryption.Encrypt(PermissionOverideId),
				}),
			);
		}

		const FetchedPermissionOverides = await Promise.all(PermissionOveridePromises);

		const NonNullPermissionOverides: PermissionsOverrides[] = [];

		for (const PermissionOveride of FetchedPermissionOverides) {
			if (PermissionOveride) NonNullPermissionOverides.push(PermissionOveride);
		}

		return NonNullPermissionOverides.map((PermissionOveride) => Encryption.CompleteDecryption(PermissionOveride));
	}

	private async FetchGuildId(ChannelId: string) {
		const Channel = await this.App.Cassandra.Models.Channel.get(
			{
				ChannelId: Encryption.Encrypt(ChannelId),
			},
			{
				fields: ["guild_id"],
			},
		);

		if (!Channel) return null;

		return Encryption.Decrypt<string>(Channel.GuildId);
	}
	
	private FixObject(object: {
		AllowedMentions: number;
		Attachments: string[];
		Author: {
			Avatar: string;
			Bot: boolean;
			Flags: string;
			Id: string;
			JoinedAt: Date;
			PublicFlags: string;
			Roles: string[];
			Tag: string;
			Username: string;
		};
		Content: string;
		Embeds: MainObject[];
		Flags: number;
		Id: string;
		Mentions: {
			Channels: string[];
			Roles: string[];
			Users: string[];
		};
		Nonce: string;
		ReplyingTo: string;
	}) {
		// In embeds, if the value is "null" remove it.
		// Stuff like nonce, replyingTo, and avatar in author if its an empty string change it to null
		const NewObject: Record<string, any> = {};
		
		for (const [key, value] of Object.entries(object)) {
			if (key === "Embeds") {
				const NewEmbeds: MainObject[] = [];
				
				for (const Embed of value as MainObject[]) {
					const NewEmbed: Record<string, any> = {};
					
					for (const [EmbedKey, EmbedValue] of Object.entries(Embed)) {
						if (EmbedValue === null) continue;
						
						NewEmbed[EmbedKey] = EmbedValue;
					}
					
					NewEmbeds.push(NewEmbed as MainObject);
				}
				
				NewObject[key] = NewEmbeds;
			} else if (key === "Author") {
				const NewAuthor: Record<string, any> = {};
				
				for (const [AuthorKey, AuthorValue] of Object.entries(value)) {
					if (AuthorValue === "") {
						NewAuthor[AuthorKey] = null;
					} else {
						NewAuthor[AuthorKey] = AuthorValue;
					}
				}
				
				NewObject[key] = NewAuthor;
			} else if (value === "") {
				NewObject[key] = null;
			} else {
				NewObject[key] = value;
			}
		}
		
		return NewObject;
	}
}
