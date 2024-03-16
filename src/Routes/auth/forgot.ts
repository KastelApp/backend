import { Buffer } from "node:buffer";
import { render } from "@react-email/render";
import Constants from "@/Constants.ts";
import forgotPassword from "@/Emails/ForgotPassword.tsx";
import bodyValidator from "@/Middleware/BodyValidator.ts";
import type { Infer } from "@/Types/BodyValidation.ts";
import { string } from "@/Types/BodyValidation.ts";
import type API from "@/Utils/Classes/API.ts";
import Encryption from "@/Utils/Classes/Encryption.ts";
import ContentTypes from "@/Utils/Classes/Routing/Decorators/ContentTypes.ts";
import Description from "@/Utils/Classes/Routing/Decorators/Description.ts";
import Method from "@/Utils/Classes/Routing/Decorators/Method.ts";
import Middleware from "@/Utils/Classes/Routing/Decorators/Middleware.ts";
import type { CreateRoute } from "@/Utils/Classes/Routing/Route.ts";
import Route from "@/Utils/Classes/Routing/Route.ts";
import Token from "@/Utils/Classes/Token.ts";

const forgotPasswordBody = {
	email: string().email()
};

export default class ForgotPassword extends Route {
	public constructor(App: API) {
		super(App);
	}

	@Method("post")
	@Description("Reset a forgotten password")
	@ContentTypes("application/json")
	@Middleware(bodyValidator(forgotPasswordBody))
	public async postForgot({ body, set, ip }: CreateRoute<"/forgot", Infer<typeof forgotPasswordBody>>) {
		
		const user = await this.App.cassandra.models.User.get({ email: Encryption.encrypt(body.email) }, { fields: ["userId", "email", "username"] });
		
		if (!user) { // ? 204 means we successfully did nothing, though the client should always interpret this as a success
			set.status = 204;
			
			return;
		}		
		
		const generated = this.generateEmailToken(body.email);
		
		await this.App.cassandra.models.VerificationLink.insert({
			code: Encryption.encrypt(generated.token),
			createdDate: new Date(),
			expireDate: new Date(Date.now() + 1_000 * 60 * 60 * 24), // ? 24 hours
			userId: user.userId,
			flags: Constants.verificationFlags.ForgotPassword,
			id: Encryption.encrypt(generated.id),
			ip: Encryption.encrypt(ip),
		})
		
		const renderedEmail = render(forgotPassword(Encryption.decrypt(user.username), `https://development.kastelapp.com/reset/${generated.id}/${generated.token}`), {
			pretty: false
		});
		
		const renderedText = render(forgotPassword(Encryption.decrypt(user.username), `https://development.kastelapp.com/reset/${generated.id}/${generated.token}`), {
			pretty: false,
			plainText: true
		});
		
		this.App.sendEmail("NoReply", body.email, "Reset your password", renderedEmail, renderedText);
		
		set.status = 204;
	}
	
	public generateEmailToken(email: string) {
		const snowflake = this.App.snowflake.generate();
	
		const rawToken = Bun.SHA512.hash(Encryption.encrypt(`${snowflake}.${email}.${Token.generateToken(snowflake)}`)); // typed array
		
		const hexToken = Buffer.from(rawToken.buffer).toString("hex");
		
		return {
			id: snowflake,
			token: hexToken,
		}
	}
}
