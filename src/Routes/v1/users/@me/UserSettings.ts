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

import type { Request, Response } from 'express';
import User from '../../../../Middleware/User.ts';
import type App from '../../../../Utils/Classes/App.ts';
import { Encryption } from '../../../../Utils/Classes/Encryption.ts';
import Route from '../../../../Utils/Classes/Route.ts';
import type Settings from '../../../../Utils/Cql/Types/Settings.ts';

export default class UserSettings extends Route {
	public constructor(App: App) {
		super(App);

		this.Methods = ['GET'];

		this.Middleware = [
			User({
				AccessType: 'LoggedIn',
				AllowedRequesters: 'User',
				App,
			}),
		];

		this.AllowedContentTypes = [];

		this.Routes = ['/settings'];
	}

	public override async Request(Req: Request<{ userId: string }>, Res: Response) {
		switch (Req.methodi) {
			case 'GET': {
				await this.FetchSettings(Req, Res);
				break;
			}

			case 'PATCH': {
				if (Req.path.endsWith('/fetch')) {
					Req.fourohfourit();
					break;
				}

				await this.PatchSettings(Req, Res);
				break;
			}

			default: {
				Req.fourohfourit();
				break;
			}
		}
	}

	public async FetchSettings(Req: Request<{ userId: string }>, Res: Response) {
		const UserSettings = await this.App.Cassandra.Models.Settings.get({
			UserId: Encryption.Encrypt(Req.user.Id),
		});

		if (!UserSettings) return null;

		return Res.send(Encryption.CompleteDecryption(UserSettings));
	}

	public async PatchSettings(Req: Request<{ userId: string }, any, Settings>, Res: Response) {
		const { Bio, Language, Presence, Privacy, Status, Theme } = Req.body;

		const SettingsObject = {
			Bio: Encryption.Encrypt(Bio),
			Language: Encryption.Encrypt(Language),
			MaxFileUploadSize: this.App.Constants.Settings.Max.MaxFileSize,
			MaxGuilds: this.App.Constants.Settings.Max.GuildCount,
			Presence: Presence ?? this.App.Constants.Presence.Online,
			Privacy,
			Status: Encryption.Encrypt(Status),
			Theme: Encryption.Encrypt(Theme),
			UserId: Encryption.Encrypt(Req.user.Id),
		};

		await Promise.all([
			this.App.Cassandra.Models.Settings.update({
				Bio: Encryption.Encrypt(Bio),
				Language: Encryption.Encrypt(Language),
				MaxFileUploadSize: this.App.Constants.Settings.Max.MaxFileSize,
				MaxGuilds: this.App.Constants.Settings.Max.GuildCount,
				Presence: Presence ?? this.App.Constants.Presence.Online,
				Privacy,
				Status: Encryption.Encrypt(Status),
				Theme: Encryption.Encrypt(Theme),
				UserId: Encryption.Encrypt(Req.user.Id),
			}),
		]);

		return Res.status(201).json({
			...Encryption.CompleteDecryption(SettingsObject),
		});
	}
}
