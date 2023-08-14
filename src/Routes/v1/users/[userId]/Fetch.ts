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
import type App from '../../../../Utils/Classes/App.js';
import FlagRemover from '../../../../Utils/Classes/BitFields/FlagRemover.js';
import Encryption from '../../../../Utils/Classes/Encryption.js';
import ErrorGen from '../../../../Utils/Classes/ErrorGen.js';
import Route from '../../../../Utils/Classes/Route.js';
import type { User as UserType } from '../../../../Utils/Cql/Types/index.js';

interface UserObject {
	Avatar: string | null;
	Bio?: string;
	GlobalNickname: string | null;
	Id: string;
	PublicFlags: number;
	Tag: string;
	Username: string;
}

export default class FetchPatchUser extends Route {
	public constructor(App: App) {
		super(App);

		this.Methods = ['GET'];

		this.Middleware = [
			User({
				AccessType: 'LoggedIn',
				AllowedRequesters: 'User',
				App
			}),
		];

		this.AllowedContentTypes = ['application/json'];

		this.Routes = ['/'];
	}

	public override async Request(Req: Request, Res: Response) {
		const { userId } = Req.params as { userId: string };
		const { include } = Req.query;

		const FetchedUser = await this.FetchUser(userId);

		if (!FetchedUser) {
			const Error = ErrorGen.InvalidUser();

			Error.AddError({
				User: {
					Code: 'InvalidUser',
					Message: 'The user you tried to fetch is Invalid.',
				},
			});

			Res.status(400).send(Error.toJSON());

			return;
		}

		const SplitInclude = String(include).split(',');

		const UserObject: UserObject = {
			Id: FetchedUser.UserId,
			Username: FetchedUser.Username,
			GlobalNickname: FetchedUser.GlobalNickname.length === 0 ? null : FetchedUser.GlobalNickname,
			Tag: FetchedUser.Tag,
			Avatar: FetchedUser.Avatar.length === 0 ? null : FetchedUser.Avatar,
			PublicFlags: Number(FlagRemover.RemovePrivateNormalFlags(BigInt(FetchedUser.Flags))),
		};

		if (SplitInclude.includes('bio') && !Req.user.Bot) {
			// darkerink: Bots should not be allowed to fetch this (Personal info bots no need access to)
			const Settings = await this.App.Cassandra.Models.Settings.get({
				UserId: Encryption.encrypt(UserObject.Id),
			}, {
				fields: ['bio']
			});

			UserObject.Bio = Settings?.Bio ? Encryption.decrypt(Settings.Bio) : null;
		}

		Res.send(UserObject);
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
}
