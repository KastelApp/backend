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

// import type { Encryption, MongoDB, Redis, Regexs, Server, Ws, MailServer, Config, EmailTemplates } from './Types/Config';
import type {
	Encryption as EncrpytionConfigType,
	MongoDB as MongoDBConfigType,
	Redis as RedisConfigType,
	Regexs as RegexsConfigType,
	Server as ServerConfigType,
	Ws as WsConfigType,
	MailServer as MailServerConfigType,
	Config as ConfigType,
	EmailTemplates as EmailTemplatesConfigType,
} from './Types/Config';

const Server: ServerConfigType = {
	Port: 62_250,
	CookieSecrets: ['tests'],
	Domain: 'kastelapp.org',
	Secure: true, // https or http
	WorkerId: 1,
	Cache: {
		ClearInterval: 1_000 * 60 * 60 * 6, // six hours
		ClearOnStart: false,
	},
	StrictRouting: true,
	CaptchaEnabled: true,
	TurnstileSecret: '',
	Sentry: {
		Enabled: true,
		Dsn: '',
		TracesSampleRate: 1,
		OtherOptions: {},
		RequestOptions: {},
	},
};

const Encryption: EncrpytionConfigType = {
	Algorithm: '',
	InitVector: '',
	SecurityKey: '',
	JwtKey: '',
};

const Ws: WsConfigType = {
	Url: 'ws://localhost:8080/system',
	Password: '123',
};

const Redis: RedisConfigType = {
	Host: '',
	Port: 5_001,
	Username: '',
	Password: '',
	DB: 0,
};

const MongoDB: MongoDBConfigType = {
	User: '',
	Host: '',
	Port: '80',
	Password: '',
	Database: '',
	AuthSource: '',
	Uri: '',
};

const MailServer: MailServerConfigType = {
	Enabled: true,
	Users: [
		{
			Host: '',
			Port: 465,
			Secure: true,
			User: '',
			Password: '',
			ShortCode: 'NoReply',
		},
		{
			Host: '',
			Port: 465,
			Secure: true,
			User: '',
			Password: '',
			ShortCode: 'Support',
		},
	],
};

const EmailTemplates: EmailTemplatesConfigType = {
	VerifyEmail: {
		Subject: 'Verify your email',
		Template: '', // can be a url or a file path
		PlaceHolders: {
			Username: '{{USERNAME}}',
			VerifyLink: '{{VERIFICATION_LINK}}',
			SupportEmail: '{{SUPPORT_EMAIL}}',
		},
	},
	ResetPassword: {
		Subject: 'Reset your password',
		Template: 'https://example.com', // can be a url or a file path
		PlaceHolders: {
			Username: '{{USERNAME}}',
			ResetLink: '{{RESET_LINK}}',
			SupportEmail: '{{SUPPORT_EMAIL}}',
		},
	},
	DisabledAccount: {
		Subject: 'Your account has been disabled',
		Template: 'https://example.com', // can be a url or a file path
		PlaceHolders: {
			Uusername: '{{USERNAME}}',
			SupportEmail: '{{SUPPORT_EMAIL}}',
			Reason: '{{REASON}}', // Can Be HTML
		},
	},
};

const Regexs: RegexsConfigType = {
	// Source: https://regexr.com/2rhq7
	Email:
		/[\d!#$%&'*+/=?^_`a-z{|}~-]+(?:\.[\d!#$%&'*+/=?^_`a-z{|}~-]+)*@(?:[\da-z](?:[\da-z-]*[\da-z])?\.)+[\da-z](?:[\da-z-]*[\da-z])?/g,
	// Source: https://regexr.com/3bfsi
	Password: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[A-Za-z]).{8,72}$/g,
};

const Config: ConfigType = {
	Server,
	Encryption,
	Ws,
	Redis,
	MongoDB,
	Regexs,
	MailServer,
	EmailTemplates,
};

export { Config, Server, Encryption, Ws, Redis, MongoDB, Regexs, MailServer, EmailTemplates };

export default {
	Config,
	Server,
	Encryption,
	Ws,
	Redis,
	MongoDB,
	Regexs,
	MailServer,
	EmailTemplates,
};
