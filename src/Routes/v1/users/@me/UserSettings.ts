/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 Jdog
 * GPL 3.0 Licensed
 */

import type { Request, Response } from "express";
import User from "../../../../Middleware/User.ts";
import type App from "../../../../Utils/Classes/App.ts";
import { Encryption } from "../../../../Utils/Classes/Encryption.ts";
import ErrorGen from "../../../../Utils/Classes/ErrorGen.ts";
import Route from "../../../../Utils/Classes/Route.ts";
import type Settings from "../../../../Utils/Cql/Types/Settings.ts";

interface EditableSettings {
	Language: string;
	Presence: number;
	Privacy: number;
	Status: string;
	Theme: string;
}

export default class UserSettings extends Route {
	private readonly Editable: (keyof EditableSettings)[];

	public constructor(App: App) {
		super(App);

		this.Methods = ["GET", "PATCH"];

		this.Middleware = [
			User({
				AccessType: "LoggedIn",
				AllowedRequesters: "User",
				App,
			}),
		];

		this.AllowedContentTypes = [];

		this.Routes = ["/settings"];

		this.Editable = ["Language", "Presence", "Privacy", "Status", "Theme"];
	}

	public override async Request(Req: Request<{ userId: string }>, Res: Response) {
		switch (Req.methodi) {
			case "GET": {
				await this.FetchSettings(Req, Res);
				break;
			}

			case "PATCH": {
				if (Req.path.endsWith("/fetch")) {
					Req.fourohfourit();
					break;
				}

				await this.PatchSettings(Req, Res);
				break;
			}

			default: {
				Req.fourohfourit();
				break;
			}
		}
	}

	public async FetchSettings(Req: Request, Res: Response) {
		const UserSettings = await this.FetchUserSettings(Req.user.Id);

		if (!UserSettings) return null;

		const SettingsObject: Partial<Settings> = {
			Bio: UserSettings.Bio,
			Language: UserSettings.Language,
			Presence: UserSettings.Presence,
			Privacy: UserSettings.Privacy,
			Status: UserSettings.Status,
			Theme: UserSettings.Theme,
		};

		return Res.send(Encryption.CompleteDecryption(SettingsObject));
	}

	public async PatchSettings(Req: Request<{ userId: string }, any, Settings>, Res: Response) {
		const { Language, Presence, Privacy, Status, Theme } = Req.body;
		const Error = ErrorGen.FailedToPatchUser();
		const UserSettings = await this.FetchUserSettings(Req.user.Id);

		const FilteredItems = Object.entries(Req.body)
			.filter(([key]) => {
				return this.Editable.includes(key as keyof EditableSettings);
			})
			.reduce<{ [key: string]: number | string | null }>((prev, [key, value]) => {
				if (!["string", "number"].includes(typeof value)) prev[key as string] = null;

				prev[key as string] = value as number | string;

				return prev;
			}, {}) as unknown as EditableSettings;

		if (Object.keys(FilteredItems).length === 0) {
			Error.AddError({
				Keys: {
					Code: "NoKeys",
					Message: "There are no keys",
				},
			});
		}

		if (Object.keys(Error.Errors).length > 0) {
			Res.status(400).send(Error.toJSON());

			return;
		}

		await this.App.Cassandra.Models.Settings.update({
			...Encryption.CompleteEncryption(UserSettings),
		});

		const SettingsObject: Partial<Settings> = {
			Language,
			Presence: Presence ?? this.App.Constants.Presence.Online,
			Privacy,
			Status: Status ?? UserSettings?.Status,
			Theme,
		};

		Res.send(Encryption.CompleteDecryption(SettingsObject));
	}

	private async FetchUserSettings(UserId: string): Promise<Settings | null> {
		const User = await this.App.Cassandra.Models.Settings.get({
			UserId: Encryption.Encrypt(UserId),
		});

		if (!User) return null;

		return Encryption.CompleteDecryption(User);
	}
}
