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
import Constants from "../../Constants.ts";
import User from "../../Middleware/User.ts";
import type App from "../../Utils/Classes/App";
import VerifyFields from "../../Utils/Classes/BitFields/VerifyFlags.ts";
import Encryption from "../../Utils/Classes/Encryption.ts";
import ErrorGen from "../../Utils/Classes/ErrorGen.ts";
import LinkGeneration from "../../Utils/Classes/LinkGeneration.ts";
import Route from "../../Utils/Classes/Route.ts";
import type { User as UserType, VerificationLink } from "../../Utils/Cql/Types/index.ts";
import { T } from "../../Utils/TypeCheck.ts";

interface ForgotBody {
	Email: string;
}

export default class ForgotPassword extends Route {
	public constructor(App: App) {
		super(App);

		this.Methods = ["POST"];

		this.Middleware = [
			User({
				AccessType: "LoggedOut",
				AllowedRequesters: "User",
				App,
			}),
		];

		this.AllowedContentTypes = ["application/json"];

		this.Routes = ["/forgot"];
	}

	public override async Request(Req: Request<any, any, ForgotBody>, Res: Response) {
		const { Email } = Req.body;

		if (!T(Email, "string")) {
			const Error = ErrorGen.MissingAuthField();

			this.App.Logger.debug("[Forgot Password] Email wasn't provided :(");

			Error.AddError({
				Email: {
					Code: "InvalidEmail",
					Message: "The Email provided is Invalid, Missing or already in use",
				},
			});

			Res.send(Error.toJSON());

			return;
		}

		const FetchedUser = await this.FetchUser(undefined, Email);

		if (!FetchedUser) {
			const Error = ErrorGen.MissingAuthField();

			this.App.Logger.debug("[Forgot Password] Couldn't fetch the user, they do not exist");

			Error.AddError({
				Email: {
					Code: "InvalidEmail",
					Message: "The Email provided is Invalid, Missing or already in use",
				},
			});

			Res.send(Error.toJSON());

			return;
		}

		const { Code } = await this.VerificationLink(
			Constants.VerificationFlags.ForgotPassword,
			FetchedUser.UserId,
			Req.clientIp,
		);

		this.App.Logger.debug(`[Forgot Password] The Forgot Password code is ${Code}`);

		if (this.App.NoReply) {
			await this.App.NoReply.SendEmail(FetchedUser.Email, "Forgot Password", `Forgot Password Code: ${Code}`).catch(
				(error) => this.App.Logger.error("Failed to send the email", error),
			);
		}

		Res.status(204).end();
	}

	private async FetchUser(UserId?: string, Email?: string): Promise<UserType | null> {
		const FetchedUser = await this.App.Cassandra.Models.User.get({
			...(UserId ? { UserId: Encryption.Encrypt(UserId) } : {}),
			...(Email ? { Email: Encryption.Encrypt(Email) } : {}),
		});

		if (!FetchedUser) return null;

		return Encryption.CompleteDecryption({
			...FetchedUser,
			Flags: FetchedUser?.Flags ? String(FetchedUser.Flags) : "0",
		});
	}

	private async VerificationLink(type: number, id: string, ip: string) {
		const VerifyFlagType = new VerifyFields(type);

		const CodeId = this.App.Snowflake.Generate();

		const Code = LinkGeneration.VerifcationLink(CodeId);

		const Link: VerificationLink = {
			Code: Encryption.Encrypt(Code),
			CreatedDate: new Date(),
			ExpireDate: new Date(Date.now() + 1_000 * 60 * 60 * 24),
			Flags: VerifyFlagType.cleaned,
			Ip: Encryption.Encrypt(ip),
			UserId: Encryption.Encrypt(id),
		};

		await this.App.Cassandra.Models.VerificationLink.insert(Link);

		return {
			Code,
			Link,
		};
	}
}
