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
import Route from '../../../../Utils/Classes/Route.js';

export default class FetchAndUpdateChannel extends Route {
	public constructor(App: App) {
		super(App);

		this.Methods = ['GET', 'PATCH'];

		this.Middleware = [
			User({
				AccessType: 'LoggedIn',
				AllowedRequesters: 'User',
				App
			})
		];

		this.AllowedContentTypes = [];

		this.Routes = ['/'];
	}

	public override Request(_: Request, Res: Response): void {
		Res.send('ok');
	}
}
