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
import Guild from "../../../../../Middleware/Guild.ts";
import User from "../../../../../Middleware/User.ts";
import type App from "../../../../../Utils/Classes/App.ts";
import { FlagUtils } from "../../../../../Utils/Classes/BitFields/NewFlags.ts";
import Encryption from "../../../../../Utils/Classes/Encryption.ts";
import ErrorGen from "../../../../../Utils/Classes/ErrorGen.ts";
import Route from "../../../../../Utils/Classes/Route.ts";
import type { Ban as BanBody, Role as Roles } from "../../../../../Utils/Cql/Types/index.ts";
import PermissionHandler from "../../../../../Utils/Versioning/v1/PermissionCheck.ts";

export default class FetchAndCreateAndRemoveBan extends Route {
	public constructor(App: App) {
		super(App);

		this.Methods = ["DELETE", "GET", "POST"];

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

		this.AllowedContentTypes = ["application/json"];

		this.Routes = ["/"];
	}

	public override async Request(Req: Request<{ guildId: string; userId: string }>, Res: Response) {
		switch (Req.methodi) {
			case "GET": {
				await this.FetchBan(Req, Res);
				break;
			}

			case "POST": {
				if (Req.path.endsWith("/fetch")) {
					Req.fourohfourit();
					break;
				}

				await this.CreateBan(Req, Res);
				break;
			}

			case "DELETE": {
				if (Req.path.endsWith("/fetch")) {
					Req.fourohfourit();
					break;
				}

				await this.RemoveBan(Req, Res);
				break;
			}

			default: {
				Req.fourohfourit();
				break;
			}
		}
	}

	public async FetchBan(Req: Request<{ guildId: string }>, Res: Response) {
		const FixedBans = [];

		const Member = await this.FetchMember(Req.user.Id, Req.params.guildId);
		if (!Member) return;

		const FoundRoles = await this.FetchRoles(Member.Roles);
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
		);

		if (!PermissionCheck.HasAnyRole("ManageBans")) {
			const MissingPermissions = ErrorGen.MissingPermissions();

			MissingPermissions.AddError({
				Permissions: {
					Code: "MissingPermissions",
					Message: "You are missing the permissions to do this action.",
				},
			});

			return Res.status(403).json(MissingPermissions.toJSON());
		}

		const Bans = await this.App.Cassandra.Models.Ban.find({
			GuildId: Encryption.Encrypt(Req.params.guildId),
		});

		for (const Ban of Bans.toArray()) {
			FixedBans.push({
				BannedDate: Ban.BannedDate,
				BannerId: Ban.BannerId,
				Reason: Ban.Reason,
				UnbanDate: Ban.UnbanDate,
				UserId: Ban.UserId,
			});
		}

		return Res.send(Encryption.CompleteDecryption(FixedBans));
	}

	public async CreateBan(Req: Request<{ guildId: string }, any, BanBody>, Res: Response) {
		const { Reason, UnbanDate, UserId } = Req.body;

		const Member = await this.FetchMember(Req.user.Id, Req.params.guildId);
		if (!Member) return;

		const FoundRoles = await this.FetchRoles(Member.Roles);
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
		);

		if (!PermissionCheck.HasAnyRole("BanMembers")) {
			const MissingPermissions = ErrorGen.MissingPermissions();

			MissingPermissions.AddError({
				Permissions: {
					Code: "MissingPermissions",
					Message: "You are missing the permissions to do this action.",
				},
			});

			return Res.status(403).json(MissingPermissions.toJSON());
		}

		const BanObject: BanBody = {
			BannedDate: new Date(),
			BannerId: Req.user.Id,
			GuildId: Req.params.guildId,
			Reason,
			UnbanDate,
			UserId,
		};

		await Promise.all([
			this.App.Cassandra.Models.Ban.insert(BanObject),
			this.App.Cassandra.Models.GuildMember.update({
				Flags: this.App.Constants.GuildMemberFlags.Banned,
			}),
		]);

		return Res.status(201).json({
			...Encryption.CompleteDecryption(BanObject),
		});
	}

	public async RemoveBan(Req: Request<{ guildId: string; userId: string }>, Res: Response) {
		const Member = await this.FetchMember(Req.user.Id, Req.params.guildId);
		if (!Member) return;

		const FoundRoles = await this.FetchRoles(Member.Roles);
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
		);

		if (!PermissionCheck.HasAnyRole("ManageBans")) {
			const MissingPermissions = ErrorGen.MissingPermissions();

			MissingPermissions.AddError({
				Permissions: {
					Code: "MissingPermissions",
					Message: "You are missing the permissions to do this action.",
				},
			});

			return Res.status(403).json(MissingPermissions.toJSON());
		}

		const Ban = await this.App.Cassandra.Models.Ban.remove({
			GuildId: Encryption.Encrypt(Req.params.guildId),
			UserId: Encryption.Encrypt(Req.params.userId),
		});

		if (!Ban) {
			const Error = ErrorGen.NotFound();

			Error.AddError({
				Permissions: {
					Code: "NotFound",
					Message: "The user is not banned from this guild.",
				},
			});

			return Res.status(403).json(Error.toJSON());
		}

		return Res.sendStatus(200);
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
