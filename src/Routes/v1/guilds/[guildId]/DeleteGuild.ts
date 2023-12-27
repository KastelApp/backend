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
import TwoFa from "../../../../Middleware/2FA.ts";
import Guild from "../../../../Middleware/Guild.ts";
import User from "../../../../Middleware/User.ts";
import type App from "../../../../Utils/Classes/App";
import Encryption from "../../../../Utils/Classes/Encryption.ts";
import Route from "../../../../Utils/Classes/Route.ts";

// To Do: Change this to add the guild to a queue instead of doing it all in this route.
export default class DeleteGuild extends Route {
	public constructor(App: App) {
		super(App);

		this.Methods = ["DELETE"];

		this.Middleware = [
			User({
				AccessType: "LoggedIn",
				AllowedRequesters: "User",
				App,
			}),
			Guild({
				App,
				Required: true,
				PermissionsRequired: ["Owner"],
			}),
			TwoFa({
				App,
			}),
		];

		this.AllowedContentTypes = ["application/json"];

		this.Routes = ["/"];
	}

	public override async Request(Req: Request<{ guildId: string }>, Res: Response) {
		const Guild = await this.FetchGuild(Encryption.Encrypt(Req.params.guildId));

		if (!Guild) {
			Res.status(500).send("Internal Server Error :(");

			return;
		}

		const GuildRoles = await this.App.Cassandra.Models.Role.find({
			GuildId: Encryption.Encrypt(Guild.GuildId),
		});

		const GuildMembers = await this.App.Cassandra.Models.GuildMember.find({
			GuildId: Encryption.Encrypt(Guild.GuildId),
		});

		const GuildChannels = await this.App.Cassandra.Models.Channel.find({
			GuildId: Encryption.Encrypt(Guild.GuildId),
		});

		const GuildInvites = await this.App.Cassandra.Models.Invite.find({
			GuildId: Encryption.Encrypt(Guild.GuildId),
		});

		const Promises = [];

		for (const Role of GuildRoles.toArray() ?? []) {
			Promises.push(
				this.App.Cassandra.Models.Role.remove({
					GuildId: Encryption.Encrypt(Guild.GuildId),
					RoleId: Role.RoleId,
				}),
			);
		}

		for (const Member of GuildMembers.toArray() ?? []) {
			Promises.push(
				this.App.Cassandra.Models.GuildMember.remove({
					GuildId: Encryption.Encrypt(Guild.GuildId),
					UserId: Member.UserId,
				}),
			);
		}

		for (const Channel of GuildChannels.toArray() ?? []) {
			Promises.push(
				this.App.Cassandra.Models.Channel.remove({
					GuildId: Encryption.Encrypt(Guild.GuildId),
					ChannelId: Channel.ChannelId,
				}),
			);

			const ChannelMessages = await this.App.Cassandra.Models.Message.find({
				ChannelId: Channel.ChannelId,
			});

			for (const Message of ChannelMessages.toArray() ?? []) {
				Promises.push(
					this.App.Cassandra.Models.Message.remove({
						MessageId: Message.MessageId,
						ChannelId: Message.ChannelId,
					}),
				);
			}
		}

		for (const Invite of GuildInvites.toArray() ?? []) {
			Promises.push(
				this.App.Cassandra.Models.Invite.remove({
					GuildId: Encryption.Encrypt(Guild.GuildId),
					Code: Invite.Code,
				}),
			);
		}

		Promises.push(
			this.App.Cassandra.Models.Guild.remove({
				GuildId: Encryption.Encrypt(Guild.GuildId),
			}),
		);

		await Promise.all(Promises);

		Res.status(202).send();
	}

	private async FetchGuild(GuildId: string) {
		const Guild = await this.App.Cassandra.Models.Guild.get({
			GuildId,
		});

		if (!Guild) {
			return null;
		}

		return Encryption.CompleteDecryption(Guild);
	}
}
