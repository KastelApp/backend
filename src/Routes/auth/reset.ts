import { verificationFlags } from "@/Constants.ts";
import bodyValidator from "@/Middleware/BodyValidator.ts";
import type { Infer } from "@/Types/BodyValidation.ts";
import { snowflake, string } from "@/Types/BodyValidation.ts";
import type API from "@/Utils/Classes/API.ts";
import Encryption from "@/Utils/Classes/Encryption.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Middleware from "@/Utils/Classes/Routing/Decorators/Middleware.ts";
import type { CreateRoute } from "@/Utils/Classes/Routing/Route.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";
import Token from "@/Utils/Classes/Token.ts";

const patchResetBody = {
	id: snowflake(),
	token: string(),
	password: string().max(72).min(4),
};

const postResetBody = {
	id: snowflake(),
	token: string(),
};

export default class ResetPassword extends Route {
	public constructor(App: API) {
		super(App);
	}

	@Method("patch")
	@Description("Reset your password")
	@ContentTypes("application/json")
	@Middleware(bodyValidator(patchResetBody))
	public async patchReset({ body, set, ip }: CreateRoute<"/reset", Infer<typeof patchResetBody>>) {
		const fetchedReset = await this.App.cassandra.models.VerificationLink.get({
			code: Encryption.encrypt(body.token),
			id: Encryption.encrypt(body.id),
		}, { fields: ["expireDate", "userId", "ip", "flags"] });

		if (!fetchedReset || fetchedReset.expireDate.getTime() < Date.now() || verificationFlags.ForgotPassword !== fetchedReset.flags) {
			this.App.logger.debug("Invalid reset token or expired token.", fetchedReset);

			set.status = 404;

			if (fetchedReset) {
				await this.App.cassandra.models.VerificationLink.remove({
					code: Encryption.encrypt(body.token),
					id: Encryption.encrypt(body.id),
					userId: fetchedReset?.userId,
				});
			}

			return;
		}

		const user = await this.App.cassandra.models.User.get({ userId: fetchedReset.userId }, { fields: ["email"] });

		if (!user) {
			this.App.logger.debug("User not found.");

			set.status = 404;

			return;
		}

		if (Encryption.encrypt(ip) !== fetchedReset.ip) {
			this.App.logger.debug("IP does not match.");

			set.status = 404;

			return;
		}

		await this.App.cassandra.models.User.update({
			userId: fetchedReset.userId,
			password: await Bun.password.hash(body.password),
		});

		const settings = await this.App.cassandra.models.Settings.get({ userId: fetchedReset.userId }, { fields: ["tokens"] });

		if (!settings) {
			set.status = 500;

			return "Internal Server Error :(";
		}

		const newToken = Token.generateToken(Encryption.decrypt(fetchedReset.userId));
		const sessionId = this.App.snowflake.generate();
		const newTokenObject = {
			createdDate: new Date(this.App.snowflake.timeStamp(sessionId)),
			flags: 0,
			ip,
			token: Encryption.encrypt(newToken),
			tokenId: Encryption.encrypt(sessionId),
		};

		settings.tokens = [newTokenObject];

		await this.App.cassandra.models.Settings.update({
			userId: fetchedReset.userId,
			tokens: settings.tokens,
		});

		await this.App.cassandra.models.VerificationLink.remove({
			code: Encryption.encrypt(body.token),
			id: Encryption.encrypt(body.id),
			userId: fetchedReset.userId,
		});

		set.status = 204;

		return {
			token: newToken,
			userId: Encryption.decrypt(fetchedReset.userId),
		};
	}

	@Method("post")
	@Description("Validate an ID and token")
	@ContentTypes("application/json")
	@Middleware(bodyValidator(postResetBody))
	public async postReset({ body, set }: CreateRoute<"/reset", Infer<typeof postResetBody>>) {

		const fetchedReset = await this.App.cassandra.models.VerificationLink.get({
			code: Encryption.encrypt(body.token),
			id: Encryption.encrypt(body.id),
		}, { fields: ["expireDate", "flags"] });

		if (!fetchedReset || fetchedReset.expireDate.getTime() < Date.now() || verificationFlags.ForgotPassword !== fetchedReset.flags) {
			set.status = 404;

			if (fetchedReset) {
				await this.App.cassandra.models.VerificationLink.remove({
					code: Encryption.encrypt(body.token),
					id: Encryption.encrypt(body.id),
					userId: fetchedReset?.userId,
				});
			}

			return;
		}

		set.status = 204;
	}
}
