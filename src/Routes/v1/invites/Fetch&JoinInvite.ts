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
import User from "../../../Middleware/User.ts";
import type App from "../../../Utils/Classes/App.ts";
import FlagFields from "../../../Utils/Classes/BitFields/Flags.ts";
import GuildMemberFlags from "../../../Utils/Classes/BitFields/GuildMember.ts";
import Encryption from "../../../Utils/Classes/Encryption.ts";
import ErrorGen from "../../../Utils/Classes/ErrorGen.ts";
import Route from "../../../Utils/Classes/Route.ts";
import type { GuildMember } from "../../../Utils/Cql/Types/index.ts";

interface UserObject {
	Avatar: string | null;
	Flags: number;
	GlobalNickname: string | null;
	Id: string;
	PublicFlags: number;
	Tag: string;
	Username: string;
}

interface InvitePayload {
	Channel?: {
		Id: string;
		Name: string;
		Type: number;
	};
	Code: string;
	Creator?: UserObject;
	Guild: {
		Description: string | null;
		Features: string[];
		Id: string;
		Name: string;
	};
}

export default class FetchAndJoinInvite extends Route {
	public constructor(App: App) {
		super(App);

		this.Methods = ["GET", "PUT"];

		this.Middleware = [
			User({
				AccessType: "LoggedIn",
				AllowedRequesters: "User",
				App,
			}),
		];

		this.AllowedContentTypes = [];

		this.Routes = ["/:inviteCode"];
	}

	public override async Request(Req: Request<{ inviteCode: string }>, Res: Response) {
		switch (Req.methodi) {
			case "PUT": {
				await this.JoinInvite(Req, Res);

				break;
			}

			case "GET": {
				await this.FetchInviteReq(Req, Res);

				break;
			}

			default: {
				Req.fourohfourit();

				break;
			}
		}
	}

	public async JoinInvite(Req: Request<{ inviteCode: string }>, Res: Response) {
		const Invite = await this.FetchInvite(Req.params.inviteCode);

		const Error = ErrorGen.InvalidInvite();

		if (!Invite) {
			Error.AddError({
				Invite: {
					Code: "InvalidInvite",
					Message: "The Invite you provided was invalid, missing or you are banned from the server.",
				},
			});

			Res.status(404).send(Error.toJSON());

			return;
		}

		const Member = await this.FetchMember(Req.user.Id, Invite.GuildId);
		const Guild = await this.FetchGuild(Invite.GuildId);

		if (Member) {
			const MemberFlags = new GuildMemberFlags(Member.Flags);

			if (MemberFlags.hasOneArray(["In", "Banned"])) {
				Error.AddError({
					Invite: {
						Code: "InvalidInvite",
						Message: "The Invite you provided was invalid, missing or you are banned from the server.",
					},
				});

				Res.status(401).send(Error.toJSON());

				return;
			}
		}

		const NewMemberPayload: GuildMember = {
			Flags: this.App.Constants.GuildMemberFlags.In,
			GuildId: Encryption.Encrypt(Invite.GuildId),
			JoinedAt: new Date(),
			Nickname: "",
			Roles: [Encryption.Encrypt(Invite.GuildId)],
			Timeouts: [],
			UserId: Encryption.Encrypt(Req.user.Id),
		};

		await Promise.all([
			this.App.Cassandra.Models.GuildMember.insert(NewMemberPayload),
			this.App.Cassandra.Models.User.update({
				UserId: Encryption.Encrypt(Req.user.Id),
				Guilds: [...Encryption.CompleteEncryption(Req.user.Guilds), NewMemberPayload.GuildId],
			}),
		]);
		
		this.App.SystemSocket.Events.GuildJoin({
			GuildId: Encryption.Decrypt(Invite.GuildId),
			UserId: Req.user.Id
		})
		
		Res.send(Guild);
	}

	public async FetchInviteReq(Req: Request<{ inviteCode: string }>, Res: Response) {
		const Invite = await this.FetchInvite(Req.params.inviteCode);

		const Error = ErrorGen.InvalidInvite();

		if (!Invite) {
			Error.AddError({
				Invite: {
					Code: "InvalidInvite",
					Message: "The Invite you provided was invalid, missing or you are banned from the server.",
				},
			});

			Res.status(404).send(Error.toJSON());

			return;
		}

		const ReturnPayload: Partial<InvitePayload> = {
			Code: Req.params.inviteCode,
		};

		const FetchedUser = await this.FetchUser(Invite.CreatorId);

		if (FetchedUser) {
			const FlagUtils = new FlagFields(FetchedUser.Flags, FetchedUser.PublicFlags);

			const UserObject: UserObject = {
				Id: FetchedUser.UserId,
				Username: FetchedUser.Username,
				GlobalNickname: FetchedUser.GlobalNickname.length === 0 ? null : FetchedUser.GlobalNickname,
				Tag: FetchedUser.Tag,
				Avatar: FetchedUser.Avatar.length === 0 ? null : FetchedUser.Avatar,
				PublicFlags: Number(FlagUtils.PublicFlags.cleaned),
				Flags: Number(FlagUtils.PublicPrivateFlags),
			};

			ReturnPayload.Creator = UserObject;
		}

		const Guild = await this.FetchGuild(Invite.GuildId);

		if (Guild) {
			ReturnPayload.Guild = Guild;
		}

		const Channel = await this.App.Cassandra.Models.Channel.get(
			{
				ChannelId: Encryption.Encrypt(Invite.ChannelId),
			},
			{
				fields: ["name", "type"],
			},
		);

		if (Channel) {
			ReturnPayload.Channel = {
				Id: Invite.ChannelId,
				Name: Encryption.Decrypt(Channel.Name),
				Type: Channel.Type,
			};
		}

		Res.send(ReturnPayload);
	}

	private async FetchGuild(GuildId: string) {
		const Guild = await this.App.Cassandra.Models.Guild.get(
			{
				GuildId: Encryption.Encrypt(GuildId),
			},
			{
				fields: ["name", "features", "description", "icon", "owner_id"],
			},
		);

		if (!Guild) return null;

		return Encryption.CompleteDecryption({
			Id: GuildId,
			Name: Guild.Name,
			Description: Guild.Description.length === 0 ? null : Guild.Description,
			Features: Guild.Features ?? [],
			OwnerId: Guild.OwnerId,
			Icon: Guild.Icon.length === 0 ? null : Guild.Icon,
		});
	}

	private async FetchInvite(InviteCode: string) {
		const Invite = await this.App.Cassandra.Models.Invite.get({
			Code: Encryption.Encrypt(InviteCode),
		});

		if (!Invite) return null;

		return Encryption.CompleteDecryption(Invite);
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

	private async FetchUser(UserId?: string) {
		const FetchedUser = await this.App.Cassandra.Models.User.get(
			{
				...(UserId ? { UserId: Encryption.Encrypt(UserId) } : {}),
			},
			{
				allowFiltering: true,
			},
		);

		if (!FetchedUser) return null;

		return Encryption.CompleteDecryption({
			...FetchedUser,
			Flags: FetchedUser?.Flags ? String(FetchedUser.Flags) : "0",
		});
	}
}
