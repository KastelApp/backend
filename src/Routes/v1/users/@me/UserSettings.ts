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

import type App from '../../../../Utils/Classes/App.ts';
import { Encryption } from '../../../../Utils/Classes/Encryption.ts';
import type { Request, Response } from 'express';
import Route from '../../../../Utils/Classes/Route.ts';
import Settings from '../../../../Utils/Cql/Types/Settings.ts';
import User from '../../../../Middleware/User.ts';

export default class UserSettings extends Route {
	public constructor(App: App) {
		super(App);

		this.Methods = ['GET', 'PATCH'];

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
		switch(Req.methodi){
			case 'GET': {
				await this.FetchSettings(Req, Res);
				break;
			}

			case 'PATCH': {
				if(Req.path.endsWith('/fetch')){
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

	public async FetchSettings(Req: Request<{ userId: string }>, Res: Response){
		const UserSettings = await this.FetchUserSettings(Req.user.Id);

		if(!UserSettings) return null;
		
		const SettingsObject = {
			Bio: UserSettings.Bio,
			Language: UserSettings.Language,
			Presence: UserSettings.Presence,
			Privacy: UserSettings.Privacy,
			Status: UserSettings.Status,
			Theme: UserSettings.Theme
		}

		return Res.send(Encryption.CompleteDecryption(SettingsObject));
	}

	public async PatchSettings(Req: Request<{ userId: string }, any, Settings>, Res: Response){
		const { Bio, Language, Presence, Privacy, Status, Theme } = Req.body;

		const SettingsObject: Partial<Settings> = {
			Bio: Encryption.Encrypt(Bio),
			Language: Language,
			MaxFileUploadSize: this.App.Constants.Settings.Max.MaxFileSize,
			MaxGuilds: this.App.Constants.Settings.Max.GuildCount,
			Presence: Presence ?? this.App.Constants.Presence.Online,
			Privacy: Privacy,
			Status: Encryption.Encrypt(Status),
			Theme: Theme,
			UserId: Encryption.Encrypt(Req.user.Id),
		};

		await this.App.Cassandra.Models.Settings.update(SettingsObject);

		return Res.status(201).json({
			...Encryption.CompleteDecryption(SettingsObject)
		});
	}

	private async FetchUserSettings(UserId: string){
		const User = await this.App.Cassandra.Models.Settings.get({
			UserId: Encryption.Encrypt(UserId)
		});

		if(!User) return null;

		return Encryption.CompleteDecryption(User);
	}
}
