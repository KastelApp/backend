import { statusTypes } from "@/Constants.ts";
import bodyValidator from "@/Middleware/BodyValidator.ts";
import userMiddleware from "@/Middleware/User.ts";
import type { Infer } from "@/Types/BodyValidation.ts";
import { string } from "@/Types/BodyValidation.ts";
import type API from "@/Utils/Classes/API.ts";
import FlagFields from "@/Utils/Classes/BitFields/Flags.ts";
import Encryption from "@/Utils/Classes/Encryption.ts";
import errorGen from "@/Utils/Classes/ErrorGen.ts";
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
	code: string().optional(),
};

export default class Login extends Route {
	public constructor(App: API) {
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
	public async postLogin({ body, set, ip }: CreateRoute<"/login", Infer<typeof postLoginBody>>) {
		const fetchedUser = await this.fetchUser(body.email);

		if (!fetchedUser) {
			const error = errorGen.InvalidCredentials();

			error.addError({
				login: {
					code: "BadLogin",
					message: "The Email or Password provided were invalid or missing.",
				},
			});

			set.status = 401;

			return error.toJSON();
		}

		if (!fetchedUser.password) {
			const error = errorGen.InvalidCredentials();

			error.addError({
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

			error.addError({
				login: {
					code: "BadLogin",
					message: "The Email or Password provided were invalid or missing.",
				},
			});

			set.status = 401;

			return error.toJSON();
		}

		const flags = new FlagFields(fetchedUser.flags, fetchedUser.publicFlags);

		if (flags.has("AccountDeleted")) {
			const error = errorGen.AccountNotAvailable();

			error.addError({
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

			error.addError({
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

			error.addError({
				login: {
					code: "AccountDisabled",
					message: "The account has been disabled.",
				},
			});

			set.status = 401;

			return error.toJSON();
		}

		const newToken = Token.generateToken(fetchedUser.userId);

		let tokens = await this.App.cassandra.models.Settings.get(
			{
				userId: Encryption.encrypt(fetchedUser.userId),
			},
			{
				fields: ["userId", "tokens"],
			},
		);

		const wasNull = !tokens;

		if (!tokens) {
			tokens = {
				bio: null,
				language: "en-US",
				maxFileUploadSize: this.App.constants.settings.Max.MaxFileSize,
				maxGuilds: this.App.constants.settings.Max.GuildCount,
				mentions: [],
				privacy: 0,
				status: statusTypes.offline | statusTypes.online,
				customStatus: null,
				theme: "dark",
				tokens: [],
				userId: Encryption.encrypt(fetchedUser.userId),
				guildOrder: [],
				allowedInvites: 0, // ? You get 0 invites on creation
			};
		}

		const sessionId = this.App.snowflake.generate();
		const newTokenObject = {
			createdDate: new Date(this.App.snowflake.timeStamp(sessionId)),
			flags: 0,
			ip,
			token: Encryption.encrypt(newToken),
			tokenId: Encryption.encrypt(sessionId),
		};

		if (tokens.tokens) tokens.tokens.push(newTokenObject);
		else tokens.tokens = [newTokenObject];

		if (wasNull) {
			await this.App.cassandra.models.Settings.insert(tokens);
		} else {
			await this.App.cassandra.models.Settings.update(tokens);
		}

		this.App.rabbitMQForwarder("sessions.create", {
			sessionId,
			userId: fetchedUser.userId,
		});

		return {
			token: newToken,
		};
	}

	private async fetchUser(email: string) {
		const fetched = await this.App.cassandra.models.User.get(
			{
				email: Encryption.encrypt(email),
			},
			{
				fields: ["email", "userId", "password", "flags", "publicFlags"],
			},
		);

		if (!fetched) {
			return null;
		}

		return Encryption.completeDecryption({
			...fetched,
			flags: fetched.flags ? String(fetched.flags) : "0",
		});
	}
}
