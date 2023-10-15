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
import User from '../../../../../Middleware/User.ts';
import type App from '../../../../../Utils/Classes/App';
import Route from '../../../../../Utils/Classes/Route.ts';
import type { MainObject } from '../../../../../Utils/Cql/Types/Message.ts';
import { T } from '../../../../../Utils/TypeCheck.ts';

interface Message {
	AllowedMentions: number;
	Attachments: string[];
	Content: string;
	Embeds: MainObject[];
	Flags: number;
	Nonce: string;
	ReplyingTo: string;
}

export default class FetchAndCreateMessages extends Route {
	public constructor(App: App) {
		super(App);

		this.Methods = ['GET', 'POST'];

		this.Middleware = [
			User({
				AccessType: 'LoggedIn',
				AllowedRequesters: 'User',
				App,
			}),
		];

		this.AllowedContentTypes = ['application/json'];

		this.Routes = ['/'];
	}

	public override async Request(Req: Request<{ channelId: string}>, Res: Response): Promise<void> {
		switch (Req.methodi) {
			case "GET": {
				await this.FetchMessagesGet(Req, Res);
				
				break;
			}
			
			case "POST": {
				await this.CreateMessagePost(Req, Res);
				
				break;
			}
			
			default: {
				Req.fourohfourit();

				break;
			}
		}
	}
	
	private async FetchMessagesGet(Request: Request, Res: Response): Promise<void> {}
	
	private async CreateMessagePost(Request: Request<{ channelId: string }, any, Message>, Res: Response): Promise<void> {
		const {
			AllowedMentions,
			Attachments,
			Content,
			Embeds,
			Flags,
			Nonce,
			ReplyingTo,
		} = Request.body;
		
		if (!T(AllowedMentions, 'number')) {
			Res.status(400).send('Bad Request');

			return;
		}
		
		console.log();
	}
}
