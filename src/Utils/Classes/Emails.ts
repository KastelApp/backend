import nodemailer from "nodemailer";

class Emails {
    host: string;
    port: number;
    secure: boolean;
    private email!: string;
    private password!: string;
    totalEmailsSent: number;
    private transporter?: nodemailer.Transporter | undefined;
    constructor(
        host: string,
        port: number,
        secure: boolean,
        email: string,
        password: string
    ) {
        this.host = host;

        this.port = port;

        this.secure = secure;
        
        Object.defineProperty(this, "email", {
            value: email,
            writable: false,
            enumerable: false,
            configurable: false,
        });

        Object.defineProperty(this, "password", {
            value: password,
            writable: false,
            enumerable: false,
            configurable: false,
        });

        this.totalEmailsSent = 0; // why not

        Object.defineProperty(this, "transporter", {
            value: undefined,
            writable: true,
            enumerable: false,
            configurable: false,
        });
    }

    async SendEmail(
        to: string,
        subject: string,
        text?: string,
        html?: string
    ): Promise<boolean> {

        if (!this.transporter) {
            throw new Error("Transporter not created");
        }

        if (!to || !subject) {
            throw new Error("Invalid arguments");
        }

        if (!text && !html) {
            throw new Error("Invalid arguments");
        }

        const Sent = await this.transporter.sendMail({
            from: this.email,
            to,
            subject,
            text,
            html,
        });

        if (Sent) {
            this.totalEmailsSent++;
            return true;
        }

        return false;
    }

    async Connect(): Promise<nodemailer.Transporter> {

        if (!this.transporter) {
            this.transporter = nodemailer.createTransport({
                host: this.host,
                port: this.port,
                secure: this.secure,
                auth: {
                    user: this.email,
                    pass: this.password,
                },
            });
        }

        return this.transporter;
    }

    async CloseTransporter(): Promise<void> {
        if (this.transporter) {
            this.transporter.close();

            this.transporter = undefined;
        }

        return;
    }
}

export { Emails };

export default Emails;