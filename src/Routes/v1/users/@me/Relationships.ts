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
import { RelationshipFlags, Settings } from '../../../../Constants.js';
import User from '../../../../Middleware/User.js';
import type App from '../../../../Utils/Classes/App.js';
import FlagRemover from '../../../../Utils/Classes/BitFields/FlagRemover.js';
import { FlagUtils } from '../../../../Utils/Classes/BitFields/NewFlags.js';
import Encryption from '../../../../Utils/Classes/Encryption.js';
import ErrorGen from '../../../../Utils/Classes/ErrorGen.js';
import Route from '../../../../Utils/Classes/Route.js';
import type { User as UserType } from '../../../../Utils/Cql/Types/index.js';

// note: add new gateway events for a relationship being edited / made >.<

interface NewRelationshipsBody {
	Flags: number;
	Users: string[];
}

export default class Friends extends Route {
	private readonly MaxManagable: number = 5; // Max amount of users they can send a friend request to (/block/edit)

	private readonly AllowedFlags: (keyof typeof RelationshipFlags)[] = [
		'Blocked',
		'Denied',
		'FriendRequest',
		'Friend',
		'None',
	];

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

	private async GetRelationships(Req: Request<{ userId?: string; }>, Res: Response) {}


	private async PostRelationship(Req: Request<any, any, NewRelationshipsBody>, Res: Response) {
		const { Flags, Users } = Req.body;

		if (!Flags || !Array.isArray(Users)) {
			const Error = ErrorGen.MissingField();

			if (!Flags) {
				Error.AddError({
					Flags: {
						Code: 'MissingOrInvalidFlags',
						Message: 'The Flags provided were Invalid or Missing.',
					},
				});
			}

			if (!Array.isArray(Users)) {
				Error.AddError({
					Users: {
						Code: 'MissingOrInvalidUsers',
						Message: 'The Users provided were Invalid or Missing.',
					},
				});
			}

			Res.status(400).send(Error.toJSON());

			return;
		}

		if (Users.length > this.MaxManagable) {
			const Error = ErrorGen.LimitReached();

			Error.AddError({
				Users: {
					Code: 'LimitReached',
					Message: `Wow there buck'o, You can only manage ${this.MaxManagable} users at a time`,
				},
			});

			Res.status(400).send(Error.toJSON());

			return;
		}

		const RelationshipFlag = new FlagUtils<typeof RelationshipFlags>(Flags, RelationshipFlags);

		if (
			RelationshipFlag.toArray().length !== 1 ||
			!this.AllowedFlags.some((value) => RelationshipFlag.hasString(value))
		) {
			const Error = ErrorGen.MissingField();

			Error.AddError({
				Flags: {
					Code: 'MissingOrInvalidFlags',
					Message: 'The Flags provided were Invalid or Missing.',
				},
			});

			Res.status(400).send(Error.toJSON());

		}

	}

	private async FetchUser(UserId?: string, Email?: string): Promise<UserType | null> {
		const FetchedUser = await this.App.Cassandra.Models.User.get({
			...(UserId ? { UserId: Encryption.encrypt(UserId) } : {}),
			...(Email ? { Email: Encryption.encrypt(Email) } : {}),
		});

		if (!FetchedUser) return null;

		return Encryption.completeDecryption({
			...FetchedUser,
			Flags: FetchedUser?.Flags ? String(FetchedUser.Flags) : '0',
		});
	}

	private async FetchRelationship(UserId: string) {}

	private async CountFriends(UserId: string, RequiredFlags?: number) {}
}
