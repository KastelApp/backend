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
import Route from '../../../../Utils/Classes/Route.ts';

// note: add new gateway events for a relationship being edited / made >.<

interface NewRelationshipsBody {
	Flags: number;
	Users: string[];
}

export default class Friends extends Route {
	public constructor(App: App) {
		super(App);

		this.Methods = ['GET', 'POST', 'PATCH'];

		this.Middleware = [
			User({
				AccessType: 'LoggedIn',
				AllowedRequesters: 'User',
				DisallowedFlags: ['FriendBan'],
				App
			}),
		];

		this.AllowedContentTypes = ['application/json'];

		this.Routes = ['/relationships', '/relationships/:userId'];
	}

	public override async Request(Req: Request<{ userId?: string; }>, Res: Response) {
		if (Req.methodi !== 'GET' && Req.params.userId) {
			Req.fourohfourit();

			return;
		}

		switch (Req.method.toLowerCase()) {
			case 'patch': {
				await this.PostRelationship(Req, Res);

				break;
			}

			case 'get': {
				await this.GetRelationships(Req, Res);

				break;
			}

			case 'post': {
				await this.PostRelationship(Req, Res);

				break;
			}

			default: {
				this.App.Logger.warn(`Weird Bypass in Method (${Req.method})`);

				Res.status(500).send('Internal Server Error :(');

				break;
			}
		}
	}

	private async GetRelationships(_: Request<{ userId?: string; }>, __: Response) { }


	private async PostRelationship(_: Request<any, any, NewRelationshipsBody>, __: Response) { }

}
