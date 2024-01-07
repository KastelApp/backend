import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cwd } from "node:process";
import { request } from "undici";
import { emailTemplates, mailServer } from "../../Config.ts";

const supportEmail = mailServer.Users.find((user) => user.ShortCode === "Support")?.User;

class EMailTemplate {
	public static async EmailVerification(Username: string, VerificationLink: string): Promise<string> {
		const template = await this.GetTemplate(emailTemplates.VerifyEmail);

		return template
			.replace(emailTemplates.VerifyEmail.PlaceHolders.Username, Username)
			.replace(emailTemplates.VerifyEmail.PlaceHolders.VerifyLink, VerificationLink)
			.replace(emailTemplates.VerifyEmail.PlaceHolders.SupportEmail, supportEmail as string);
	}

	public static async GetTemplate(
		EmailTemplate: (typeof emailTemplates)[keyof typeof emailTemplates],
	): Promise<string> {
		const urlRegex = /^https?:\/\/(?:www\.)?[\w#%+.:=@~-]{1,256}\.[\d()A-Za-z]{1,6}\b[\w#%&()+./:=?@~-]*$/g;

		if (!EmailTemplate.Template) throw new Error("No Template was provided");

		if (urlRegex.test(EmailTemplate.Template)) {
			const { body } = await request(EmailTemplate.Template);

			return body.text();
		}

		return readFileSync(join(cwd(), EmailTemplate.Template), "utf8");
	}
}

export default EMailTemplate;

export { EMailTemplate };
