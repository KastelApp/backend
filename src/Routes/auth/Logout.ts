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
import User from "../../Middleware/User.js";
import type App from "../../Utils/Classes/App";
import Encryption from "../../Utils/Classes/Encryption.js";
import Route from "../../Utils/Classes/Route.js";
import { SettingSchema } from "../../Utils/Schemas/Schemas.js";

export default class Logout extends Route {
	public constructor(App: App) {
		super(App);

		this.Methods = ['DELETE'];

		this.Middleware = [
			User({
				AccessType: 'LoggedIn',
				AllowedRequesters: 'User',
			})
		];
		this.AllowedContentTypes = [];

		this.Routes = ['/logout'];
	}

	public override async Request(Req: Request, Res: Response) {
		const FoundToken = await SettingSchema.findOne({
			User: Encryption.encrypt(Req.user.Id),
			'Tokens.Token': Encryption.encrypt(Req.user.Token),
		});

		if (!FoundToken) {
			Res.status(500).send('Internal Server Error');

			return;
		}

		FoundToken.Tokens = FoundToken.Tokens.filter((Token) => Token.Token !== Encryption.encrypt(Req.user.Token));

		await FoundToken.save();

		Res.status(204).end();

	}
}
