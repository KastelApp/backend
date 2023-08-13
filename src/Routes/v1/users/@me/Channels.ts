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
import User from '../../../../Middleware/User.js';
import type App from '../../../../Utils/Classes/App';
import Encryption from '../../../../Utils/Classes/Encryption.js';
import ErrorGen from '../../../../Utils/Classes/ErrorGen.js';
import Route from '../../../../Utils/Classes/Route.js';

interface CreateChannelBody {
	Flags: number;
	Recipients: string[];
}

export default class Sessions extends Route {
	public constructor(App: App) {
		super(App);

		this.Methods = ['GET', 'POST', 'DELETE'];

		this.Middleware = [
			User({
				AccessType: 'LoggedIn',
				AllowedRequesters: 'User',
				App
			}),
		];

		this.AllowedContentTypes = ['application/json'];

		this.Routes = ['/channels', '/channels/:channelId'];
	}

	public override async Request(Req: Request, Res: Response) {
		switch (Req.method.toLowerCase()) {
			case 'get': {
				await this.GetChannels(Req, Res);

				break;
			}

			case 'post': {
				if (Req.params.channelId) {
					this.App.Logger.debug(`They provided a channel id :( which was ${Req.params.channelId}`);

					Req.fourohfourit();

					return;
				}

				await this.CreateDm(Req, Res);

				break;
			}

			case 'delete': {
				await this.DeleteDm(Req, Res);

				break;
			}

			default: {
				this.App.Logger.warn(`Weird Bypass in Method (${Req.method})`);

				Res.status(500).send('Internal Server Error :(');

				break;
			}
		}
	}

	private async GetChannels(Req: Request<{ channelId?: string }>, Res: Response) {}

	private async CreateDm(Req: Request<any, any, CreateChannelBody>, Res: Response) {
		const { Flags, Recipients } = Req.body;

		this.App.Logger.debug(`Flags: ${Flags}, Recipients: ${Recipients?.join(', ')}`);
	}

	private async DeleteDm(Req: Request<{ channelId?: string }>, Res: Response) {}

	private async GetAllChannels(UserId: string) {}
}
