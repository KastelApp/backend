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
import User from '../../Middleware/User.js';
import type App from '../../Utils/Classes/App';
import Encryption from '../../Utils/Classes/Encryption.js';
import Route from '../../Utils/Classes/Route.js';

interface Tokens {
	CreatedDate: Date;
	Flags: number;
	Ip: string;
	Token: string;
	TokenId: string;
}

export default class Logout extends Route {
	public constructor(App: App) {
		super(App);

		this.Methods = ['DELETE'];

		this.Middleware = [
			User({
				AccessType: 'LoggedIn',
				AllowedRequesters: 'User',
				App
			}),
		];

		this.AllowedContentTypes = [];

		this.Routes = ['/logout'];
	}

	public override async Request(Req: Request, Res: Response) {
		const Tokens = await this.FetchSessions(Req.user.Id);

		if (Tokens.length === 0) {
			this.App.Logger.debug(`Weird, No sessions found for the user? ID: ${Req.user.Id}`);

			Res.status(500).send('Internal Server Error :(');

			return;
		}
		
		const FoundSession = Tokens.find((session) => session.Token === Encryption.encrypt(Req.user.Token));
		
		if (!FoundSession) {
			this.App.Logger.debug(`Weird, No session found for the user? ID: ${Req.user.Id}`);

			Res.status(500).send('Internal Server Error :(');

			return;
		}
		
		const FilteredSessions = Tokens.filter((session) => session.Token !== Encryption.encrypt(Req.user.Token));

		this.App.SystemSocket.Events.DeletedSession({
			UserId: Req.user.Id,
			SessionId: Encryption.decrypt(FoundSession.TokenId),
		});
		
		// const Mapped: ({created_date: number; flags: number; ip: string; token_: string; token_id: string}[])[] = this.App.Cassandra.UnderScoreCqlToPascalCaseMappings.ObjectToDbRow(FilteredSessions) as unknown as ({created_date: number; flags: number; ip: string; token_: string; token_id: string}[])[];

		await this.App.Cassandra.Models.Settings.update({
			UserId: Encryption.encrypt(Req.user.Id),
			Tokens: FilteredSessions
		});

		Res.status(204).end();
	}

	private async FetchSessions(UserId: string): Promise<Tokens[]> {
		const Settings = await this.App.Cassandra.Models.Settings.get({
			UserId: Encryption.encrypt(UserId),
		}, {
			fields: ['tokens']
		});

		if (!Settings) return [];

		return Settings.Tokens;
	}
}
