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
import { InviteFlags, PermissionOverrideTypes } from "../../../../../Constants.ts";
import Guild from "../../../../../Middleware/Guild.ts";
import User from "../../../../../Middleware/User.ts";
import type App from "../../../../../Utils/Classes/App.ts";
import GuildMemberFlags from "../../../../../Utils/Classes/BitFields/GuildMember.ts";
import { FlagUtils } from "../../../../../Utils/Classes/BitFields/NewFlags.ts";
import Encryption from "../../../../../Utils/Classes/Encryption.ts";
import ErrorGen from "../../../../../Utils/Classes/ErrorGen.ts";
import Route from "../../../../../Utils/Classes/Route.ts";
import type Roles from "../../../../../Utils/Cql/Types/Role.ts";
import type { Invite } from "../../../../../Utils/Cql/Types/index.ts";
import InviteGenerator from "../../../../../Utils/InviteGenerator.ts";
import PermissionHandler from "../../../../../Utils/Versioning/v1/PermissionCheck.ts";

interface InviteBody {
	ChannelId: string;
	Code: string;
	ExpiresAt: number;
	MaxUses: number;
	Type: number;
}

export default class FetchCreateAndDeleteInvites extends Route {
	private readonly MaxUses: number;

	public constructor(App: App) {
		super(App);

		this.Methods = ["GET", "DELETE", "POST"];

		this.Middleware = [
			User({
				AccessType: "LoggedIn",
				AllowedRequesters: "User",
				App,
			}),
			Guild({
				App,
				Required: true,
			}),
		];

		this.AllowedContentTypes = [];

		this.Routes = ["/", "/:inviteId"];

		this.MaxUses = 100;
	}

	public override async Request(Req: Request<{ inviteId?: string }>, Res: Response) {
		if (Req.params?.inviteId && Req.methodi !== "DELETE") {
			Req.fourohfourit();

			return;
		}

		switch (Req.methodi) {
			case "DELETE": {
				// await this.DeleteInvite(Req, Res);

				break;
			}

			case "GET": {

				console.log(Req.path)
				
				if (Req.path.includes("/@me")) {
					await this.FetchAtMeInvites(Req, Res);
				} else {
					await this.FetchInvites(Req, Res);
				}
				
				break;
			}

			case "POST": {
				await this.CreateInvite(Req, Res);

				break;
			}

			default: {
				Req.fourohfourit();

				break;
			}
		}
	}

	public async CreateInvite(Req: Request<any, any, InviteBody>, Res: Response): Promise<void> {
		const { ChannelId, ExpiresAt, MaxUses, Type } = Req.body;

		const InviteType = new FlagUtils<typeof InviteFlags>(Type ?? 0, InviteFlags);

		if ((typeof ChannelId !== "string" && !InviteType.has("Vanity")) || InviteType.count !== 1) {
			const Error = ErrorGen.FailedToCreateInvite();

			if (typeof ChannelId !== "string" && !InviteType.has("Vanity")) {
				Error.AddError({
					ChannelId: {
						Code: "InvalidChannelId",
						Message: "The provided channel id is missing or invalid",
					},
				});
			}

			if (InviteType.count !== 1) {
				Error.AddError({
					Type: {
						Code: "InvalidType",
						Message: "The provided type is invalid",
					},
				});
			}

			Res.status(400).json(Error.toJSON());

			return;
		}

		if ((MaxUses && typeof MaxUses !== "number") || MaxUses < 0 || MaxUses > this.MaxUses) {
			const Error = ErrorGen.FailedToCreateInvite();

			Error.AddError({
				MaxUses: {
					Code: "InvalidMaxUses",
					Message: "The provided max uses is invalid",
				},
			});

			Res.status(400).json(Error.toJSON());

			return;
		}

		const Channel = InviteType.has("Vanity") ? [] : await this.ChannelExists(ChannelId);

		if (!Channel) {
			const Error = ErrorGen.FailedToCreateInvite();

			Error.AddError({
				ChannelId: {
					Code: "InvalidChannelId",
					Message: "The provided channel id is missing or invalid",
				},
			});

			Res.status(400).json(Error.toJSON());

			return;
		}

		const Member = await this.FetchMember(Req.user.Id, Req.params.guildId);

		if (!Member) return; // will never happen

		const FoundRoles = await this.FetchRoles(Member.Roles);

		const MemberFlags = new GuildMemberFlags(Member.Flags);

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
					Id: ChannelId ?? "unknown",
					Overrides: Channel.map((override) => ({
						...override,
						Type:
							override.Type === PermissionOverrideTypes.Everyone
								? "Role"
								: override.Type === PermissionOverrideTypes.Role
								? "Role"
								: "Member",
					})),
				},
			],
		);

		if (
			ChannelId
				? InviteType.has("Vanity") && !PermissionCheck.HasAnyRole("ManageGuild")
				: !PermissionCheck.HasChannelPermission(ChannelId, "CreateInvites")
		) {
			const MissingPermissions = ErrorGen.MissingPermissions();

			MissingPermissions.AddError({
				Permissions: {
					Code: "MissingPermissions",
					Message: "You are missing the permissions to do this action.",
				},
			});

			Res.status(403).json(MissingPermissions.toJSON());

			return;
		}

		const InvitePayload: Invite = {
			ChannelId: Encryption.Encrypt(ChannelId ?? Req.guild.Guild.Id),
			Code: Encryption.Encrypt(InviteGenerator()),
			CreatorId: Encryption.Encrypt(Req.user.Id),
			Deleteable: true,
			Expires: ExpiresAt ? new Date(ExpiresAt) : new Date(Date.now() + 604_800_000),
			GuildId: Encryption.Encrypt(Req.guild.Guild.Id),
			MaxUses: MaxUses ?? 0,
			Uses: 0,
		};

		await this.App.Cassandra.Models.Invite.insert(InvitePayload);

		Res.status(201).json(
			Encryption.CompleteDecryption({
				Code: InvitePayload.Code,
				CreatorId: InvitePayload.CreatorId,
				ExpiresAt: InvitePayload.Expires,
				MaxUses: InvitePayload.MaxUses,
				Uses: 0,
				Deleteable: InvitePayload.Deleteable,
			}),
		);
	}

	// public async DeleteInvite(Req: Request<{ inviteId?: string; }>, Res: Response): Promise<void> { }

	public async FetchInvites(Req: Request, Res: Response): Promise<void> {
		const Member = await this.FetchMember(Req.user.Id, Req.guild.Guild.Id);

		if (!Member) return; // will never happen

		const FoundRoles = await this.FetchRoles(Member.Roles);

		const MemberFlags = new GuildMemberFlags(Member.Flags);

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
		);

		if (!PermissionCheck.HasAnyRole("ManageInvites")) {
			const MissingPermissions = ErrorGen.MissingPermissions();

			MissingPermissions.AddError({
				Permissions: {
					Code: "MissingPermissions",
					Message: "You are missing the permissions to do this action.",
				},
			});

			Res.status(403).json(MissingPermissions.toJSON());

			return;
		}

		const Invites = await this.App.Cassandra.Models.Invite.find({
			GuildId: Encryption.Encrypt(Req.guild.Guild.Id),
		});

		const FixedInvites = [];

		for (const InvitePayload of Invites.toArray()) {
			FixedInvites.push({
				Code: InvitePayload.Code,
				CreatorId: InvitePayload.CreatorId,
				ExpiresAt: InvitePayload.Expires,
				MaxUses: InvitePayload.MaxUses,
				Uses: InvitePayload.Uses,
				Deleteable: InvitePayload.Deleteable,
			});
		}

		Res.send(Encryption.CompleteDecryption(FixedInvites));
	}
	
	public async FetchAtMeInvites(Req: Request, Res: Response): Promise<void> {
		const Invites = await this.App.Cassandra.Models.Invite.find({
			GuildId: Encryption.Encrypt(Req.guild.Guild.Id),
		});

		const FixedInvites = [];

		for (const InvitePayload of Invites.toArray()) {
			if (InvitePayload.CreatorId !== Encryption.Encrypt(Req.user.Id)) continue;

			FixedInvites.push({
				Code: InvitePayload.Code,
				CreatorId: InvitePayload.CreatorId,
				ExpiresAt: InvitePayload.Expires,
				MaxUses: InvitePayload.MaxUses,
				Uses: InvitePayload.Uses,
				Deleteable: InvitePayload.Deleteable,
			});
		}
		
		Res.send(Encryption.CompleteDecryption(FixedInvites));
	}

	private async ChannelExists(ChannelId: string) {
		const Channel = await this.App.Cassandra.Models.Channel.get(
			{
				ChannelId: Encryption.Encrypt(ChannelId),
			},
			{
				fields: ["channel_id", "permissions_overides"],
			},
		);

		if (!Channel) return null;

		const PermissionOverrides: {
			Allow: string;
			Deny: string;
			Id: string;
			Type: number;
		}[] = [];

		for (const override of Channel.PermissionsOverrides ?? []) {
			const FetchedOverride = await this.App.Cassandra.Models.PermissionOverride.get(
				{
					PermissionId: override,
				},
				{
					fields: ["id", "type", "allow_", "deny"],
				},
			);

			if (!FetchedOverride) continue;

			PermissionOverrides.push({
				Id: FetchedOverride.Id,
				Type: FetchedOverride.Type,
				Allow: FetchedOverride.Allow.toString(),
				Deny: FetchedOverride.Deny.toString(),
			});
		}

		return PermissionOverrides;
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
}
