import { readFileSync } from "fs";
import { join } from "path";
import { request } from "undici";
import { EmailTemplates, MailServer } from "../../Config";

const SupportEmail = MailServer.Users.find(
  (u) => u.ShortCode === "Support"
)?.User;

class EMailTemplate {
  static async EmailVerification(
    Username: string,
    VerificationLink: string
  ): Promise<string> {
    const Template = await this.GetTemplate(EmailTemplates.VerifyEmail);

    const EmailTemplate = Template.replace(
      EmailTemplates.VerifyEmail.PlaceHolders.Username,
      Username
    )
      .replace(
        EmailTemplates.VerifyEmail.PlaceHolders.VerifyLink,
        VerificationLink
      )
      .replace(
        EmailTemplates.VerifyEmail.PlaceHolders.SupportEmail,
        SupportEmail as string
      );

    return EmailTemplate;
  }

  static async GetTemplate(
    EmailTemplate: EmailTemplates[keyof EmailTemplates]
  ): Promise<string> {
    const UrlRegex =
      /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/g;

    if (!EmailTemplate.Template) throw new Error("No Template was provided");

    if (UrlRegex.test(EmailTemplate.Template)) {
      const { body } = await request(EmailTemplate.Template);

      const Template = await body.text();

      return Template;
    }

    const Template = readFileSync(
      join(process.cwd(), EmailTemplate.Template),
      "utf-8"
    );

    return Template;
  }
}

export default EMailTemplate;

export { EMailTemplate };
