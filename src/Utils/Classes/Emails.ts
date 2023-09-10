import nodemailer from 'nodemailer';

class Emails {
	public host: string;

	public port: number;

	public secure: boolean;

	private readonly email!: string;

	private readonly password!: string;

	private readonly auth: boolean = true;

	public totalEmailsSent: number;

	private transporter?: nodemailer.Transporter | undefined;

	public constructor(
		host: string,
		port: number,
		secure: boolean,
		auth: boolean,
		email: string,
		password: string | undefined,
	) {
		this.host = host;

		this.port = port;

		this.secure = secure;

		Object.defineProperty(this, 'email', {
			value: email,
			writable: false,
			enumerable: false,
			configurable: false,
		});

		Object.defineProperty(this, 'password', {
			value: password,
			writable: false,
			enumerable: false,
			configurable: false,
		});

		this.totalEmailsSent = 0; // why not

		Object.defineProperty(this, 'transporter', {
			value: undefined,
			writable: true,
			enumerable: false,
			configurable: false,
		});

		Object.defineProperty(this, 'auth', {
			value: auth,
			writable: false,
			enumerable: false,
			configurable: false,
		});
	}

	public async SendEmail(to: string, subject: string, text?: string, html?: string): Promise<boolean> {
		if (!this.transporter) {
			throw new Error('Transporter not created');
		}

		if (!to || !subject) {
			throw new Error('Invalid arguments');
		}

		if (!text && !html) {
			throw new Error('Invalid arguments');
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

	public async Connect(): Promise<nodemailer.Transporter> {
		if (!this.transporter) {
			this.transporter = nodemailer.createTransport({
				host: this.host,
				port: this.port,
				secure: this.secure,
				...(this.auth
					? {
						auth: {
							user: this.email,
							pass: this.password,
						},
					}
					: {}),
			});
		}

		return this.transporter;
	}

	public async CloseTransporter(): Promise<void> {
		if (this.transporter) {
			this.transporter.close();

			this.transporter = undefined;
		}
	}
}

export { Emails };

export default Emails;
