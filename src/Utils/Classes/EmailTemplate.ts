import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cwd } from "node:process";
import { request } from "undici";
import { EmailTemplates, MailServer } from "../../Config.ts";

const SupportEmail = MailServer.Users.find((user) => user.ShortCode === "Support")?.User;

class EMailTemplate {
	public static async EmailVerification(Username: string, VerificationLink: string): Promise<string> {
		const Template = await this.GetTemplate(EmailTemplates.VerifyEmail);

		return Template.replace(EmailTemplates.VerifyEmail.PlaceHolders.Username, Username)
			.replace(EmailTemplates.VerifyEmail.PlaceHolders.VerifyLink, VerificationLink)
			.replace(EmailTemplates.VerifyEmail.PlaceHolders.SupportEmail, SupportEmail as string);
	}

	public static async GetTemplate(
		EmailTemplate: (typeof EmailTemplates)[keyof typeof EmailTemplates],
	): Promise<string> {
		const UrlRegex = /^https?:\/\/(?:www\.)?[\w#%+.:=@~-]{1,256}\.[\d()A-Za-z]{1,6}\b[\w#%&()+./:=?@~-]*$/g;

		if (!EmailTemplate.Template) throw new Error("No Template was provided");

		if (UrlRegex.test(EmailTemplate.Template)) {
			const { body } = await request(EmailTemplate.Template);

			return body.text();
		}

		return readFileSync(join(cwd(), EmailTemplate.Template), "utf8");
	}
}

export default EMailTemplate;

export { EMailTemplate };
