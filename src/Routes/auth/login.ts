import bodyValidator from "@/Middleware/BodyValidator.ts";
import userMiddleware from "@/Middleware/User.ts";
import type { Infer } from "@/Types/BodyValidation.ts";
import { string } from "@/Types/BodyValidation.ts";
import App from "@/Utils/Classes/App.ts";
import FlagFields from "@/Utils/Classes/BitFields/Flags.ts";
import Encryption from "@/Utils/Classes/Encryption.ts";
import errorGen from "@/Utils/Classes/ErrorGen.ts";
import IpUtils from "@/Utils/Classes/IpUtils.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Middleware from "@/Utils/Classes/Routing/Decorators/Middleware.ts";
import type { CreateRoute } from "@/Utils/Classes/Routing/Route.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";
import Token from "@/Utils/Classes/Token.ts";

const postLoginBody = {
	email: string(),
	password: string(),
	code: string().notRequired(),
};

export default class Login extends Route {
	public constructor(App: App) {
		super(App);
	}

	@Method("post")
	@Description("Login to an existing account")
	@ContentTypes("application/json")
	@Middleware(
		userMiddleware({
			AccessType: "LoggedOut",
			AllowedRequesters: "User",
		}),
	)
	@Middleware(bodyValidator(postLoginBody))
	public async postLogin({ body, set, request }: CreateRoute<"/login", Infer<typeof postLoginBody>>) {
		const fetchedUser = await this.fetchUser(body.email);

		if (!fetchedUser) {
			const error = errorGen.InvalidCredentials();

			error.AddError({
				login: {
					code: "BadLogin",
					message: "The Email or Pasword provided were invalid or missing.",
				},
			});

			set.status = 401;

			return error.toJSON();
		}

		if (!fetchedUser.password) {
			const error = errorGen.InvalidCredentials();

			error.AddError({
				login: {
					code: "MissingPassword",
					message: "The account has no password set, please reset your password to login.",
				},
			});

			set.status = 401;

			return error.toJSON();
		}

		const verifiedPassword = await Bun.password.verify(body.password, fetchedUser.password);

		if (!verifiedPassword) {
			const error = errorGen.InvalidCredentials();

			error.AddError({
				login: {
					code: "BadLogin",
					message: "The Email or Pasword provided were invalid or missing.",
				},
			});

			set.status = 401;

			return error.toJSON();
		}

		const flags = new FlagFields(fetchedUser.flags, fetchedUser.publicFlags);

		if (flags.has("AccountDeleted")) {
			const error = errorGen.AccountNotAvailable();

			error.AddError({
				login: {
					code: "AccountDeleted",
					message: "The account has been deleted.",
				},
			});

			set.status = 401;

			return error.toJSON();
		}

		if (flags.has("WaitingOnAccountDeletion") || flags.has("WaitingOnDisableDataUpdate")) {
			const error = errorGen.AccountNotAvailable();

			error.AddError({
				login: {
					code: "AccountDataUpdate",
					message:
						"The account is waiting on data to be deleted, or annonymized. Please contact support if you wish to reverse this action.",
				},
			});

			set.status = 401;

			return error.toJSON();
		}

		if (flags.has("Terminated") || flags.has("Disabled")) {
			const error = errorGen.AccountNotAvailable();

			error.AddError({
				login: {
					code: "AccountDisabled",
					message: "The account has been disabled.",
				},
			});

			set.status = 401;

			return error.toJSON();
		}

		const newToken = Token.generateToken(fetchedUser.userId);

		let tokens = await this.App.Cassandra.Models.Settings.get(
			{
				userId: Encryption.encrypt(fetchedUser.userId),
			},
			{
				fields: ["tokens"]
			},
		);

		const wasNull = !tokens;

		if (!tokens) {
			tokens = {
				bio: null,
				language: "en-US",
				maxFileUploadSize: this.App.Constants.settings.Max.MaxFileSize,
				maxGuilds: this.App.Constants.settings.Max.GuildCount,
				mentions: [],
				presence: this.App.Constants.presence.Online,
				privacy: 0,
				status: null,
				theme: "dark",
				tokens: [],
				userId: Encryption.encrypt(fetchedUser.userId),
			};
		}

		const sessionId = App.Snowflake.Generate();

		tokens.tokens.push({
			createdDate: new Date(App.Snowflake.TimeStamp(sessionId)),
			flags: 0,
			ip: IpUtils.getIp(request, this.App.ElysiaApp.server) ?? "",
			token: Encryption.encrypt(newToken),
			tokenId: Encryption.encrypt(sessionId),
		});

		if (wasNull) {
			await this.App.Cassandra.Models.Settings.insert(tokens);
		} else {
			await this.App.Cassandra.Models.Settings.update(tokens);
		}

		this.App.SystemSocket.Events.NewSession({
			SessionId: sessionId,
			UserId: fetchedUser.userId,
		});

		return {
			token: newToken,
		};
	}

	private async fetchUser(email: string) {
		const fetched = await this.App.Cassandra.Models.User.get({
			email: Encryption.encrypt(email),
		});

		if (!fetched) {
			return null;
		}

		return Encryption.completeDecryption({
			...fetched,
			flags: fetched.flags ? String(fetched.flags) : "0",
		});
	}
}
