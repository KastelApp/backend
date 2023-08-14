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

import { compareSync } from 'bcrypt';
import type { Request, Response } from 'express';
import User from '../../../../Middleware/User.js';
import type App from '../../../../Utils/Classes/App';
import Encryption from '../../../../Utils/Classes/Encryption.js';
import ErrorGen from '../../../../Utils/Classes/ErrorGen.js';
import Route from '../../../../Utils/Classes/Route.js';

interface Tokens {
	CreatedDate: Date;
	Flags: number;
	Ip: string;
	Token: string;
	TokenId: string;
}

interface DeleteSessionBody {
	Id: string;
	Password: string;
}

export default class Sessions extends Route {
	public constructor(App: App) {
		super(App);

		this.Methods = ['GET', 'DELETE'];

		this.Middleware = [
			User({
				AccessType: 'LoggedIn',
				AllowedRequesters: 'User',
				App
			}),
		];

		this.AllowedContentTypes = ['application/json'];

		this.Routes = ['/sessions'];
	}

	public override async Request(Req: Request, Res: Response) {
		switch (Req.method.toLowerCase()) {
			case 'delete': {
				await this.DeleteSession(Req, Res);

				break;
			}

			case 'get': {
				await this.FetchSession(Req, Res);

				break;
			}

			default: {
				this.App.Logger.warn(`Weird Bypass in Method (${Req.method})`);

				Res.status(500).send('Internal Server Error :(');

				break;
			}
		}
	}

	private async DeleteSession(Req: Request<any, any, DeleteSessionBody>, Res: Response) {
		const { Id, Password } = Req.body;

		if (!Id || !Password) {
			const Error = ErrorGen.MissingAuthField();

			if (!Id) {
				Error.AddError({
					Id: {
						Code: 'InvalidId',
						Message: 'The Id provided is Invalid, or Missing',
					},
				});
			}

			if (!Password) {
				Error.AddError({
					Password: {
						Code: 'InvalidPassword',
						Message: 'The Password provided is Invalid, or Missing',
					},
				});
			}

			Res.send(Error.toJSON());

			return;
		}

		if (!compareSync(Password, Req.user.Password)) {
			const Error = ErrorGen.InvalidCredentials();

			Error.AddError({
				Password: {
					Code: 'InvalidPassword',
					Message: 'The Password provided is Invalid, or Missing',
				},
			});

			Res.send(Error.toJSON());

			return;
		}

		const Sessions = await this.FetchSessions(Req.user.Id);

		const FilteredSessions = Sessions.filter((session) => session.TokenId !== Encryption.encrypt(Id));

		this.App.SystemSocket.Events.DeletedSession({
			UserId: Req.user.Id,
			SessionId: Id,
		});

		await this.App.Cassandra.Models.Settings.update({
			UserId: Encryption.encrypt(Req.user.Id),
			Tokens: FilteredSessions
		});

		Res.status(204).end();
	}

	// GET /sessions
	private async FetchSession(Req: Request, Res: Response) {
		const Sessions = await this.FetchSessions(Req.user.Id);

		Res.send(
			Sessions.map((Session) => {
				return {
					...Session,
					Token: '*'.repeat(Session.Token.length), // Token: Session.Token.replaceAll(/./g, '*'),
					Ip: Encryption.encrypt(Session.Ip),
					Current: Session.Token === Req.user.Token, // darkerink: Current is just so we don't delete our session by mistake (and tbh I should have a check)
				};
			}),
		);
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
