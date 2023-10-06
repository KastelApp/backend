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
import type App from '../../../../Utils/Classes/App';
import FlagFields from '../../../../Utils/Classes/BitFields/Flags.ts';
import Encryption from '../../../../Utils/Classes/Encryption.ts';
import ErrorGen from '../../../../Utils/Classes/ErrorGen.ts';
import Route from '../../../../Utils/Classes/Route.ts';
import type { User as UserType } from '../../../../Utils/Cql/Types/index.ts';

interface Body {
	Password: string;
	TwoFaCode: string;
}

export default class DisableDelete extends Route {
	public constructor(App: App) {
		super(App);

		this.Methods = ['DELETE'];

		this.Middleware = [
			User({
				AccessType: 'LoggedIn',
				AllowedRequesters: 'User',
				App,
			}),
		];

		this.AllowedContentTypes = ['application/json'];

		this.Routes = ['/disable', '/delete'];
	}

	public override async Request(Req: Request<any, any, Body>, Res: Response) {
		const { Password } = Req.body;

		const Error = ErrorGen.FailedToDisableOrDeleteSelf();

		if (!Password) {
			Error.AddError({
				Password: {
					Code: 'InvalidPassword',
					Message: 'The Password provided is Invalid, or Missing',
				},
			});

			Res.status(400).send(Error.toJSON());

			return;
		}

		const FetchedUser = await this.FetchUser(Req.user.Id, ['password', 'flags', 'public_flags']);

		if (!FetchedUser) {
			Res.status(500).send('Internal Server Error :(');

			return;
		}

		if (!(await Bun.password.verify(Password, FetchedUser.Password))) {
			Error.AddError({
				Password: {
					Code: 'InvalidPassword',
					Message: 'The Password provided is Invalid, or Missing',
				},
			});

			Res.status(401).send(Error.toJSON());

			return;
		}

		await this.App.Cassandra.Models.Settings.update({
			UserId: Encryption.Encrypt(FetchedUser.UserId),
			Tokens: [],
		});

		const Flags = new FlagFields(FetchedUser.Flags, FetchedUser.PublicFlags);

		Flags.PrivateFlags.add(
			Req.path.endsWith('/delete')
				? 'WaitingOnAccountDeletion'
				: Req.path.endsWith('/disable')
				? 'WaitingOnDisableDataUpdate'
				: 'Disabled',
		);

		Flags.PrivateFlags.add('Disabled');

		this.App.Logger.debug(
			`😭 someone is ${
				Req.path.endsWith('/delete') ? 'Deleting' : Req.path.endsWith('/disable') ? 'Disabling' : `Idk lol ${Req.path}`
			} their account :(`,
		);

		await this.App.Cassandra.Models.User.update({
			UserId: Encryption.Encrypt(FetchedUser.UserId),
			Flags: String(Flags.PrivateFlags.bits),
		});

		Res.send('See you next time!');
	}

	private async FetchUser(UserId: string, Fields: string[]): Promise<UserType | null> {
		const FetchedUser = await this.App.Cassandra.Models.User.get(
			{
				UserId: Encryption.Encrypt(UserId),
			},
			{
				fields: Fields,
			},
		);

		if (!FetchedUser) return null;

		return Encryption.CompleteDecryption({
			...FetchedUser,
			Flags: FetchedUser?.Flags ? String(FetchedUser.Flags) : '0',
		});
	}
}
