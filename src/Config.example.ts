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
	ScyllaDB as ScyllaDBConfigType,
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
	Domain: 'kastelapp.com',
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
		Enabled: false,
		Dsn: '',
		TracesSampleRate: 1,
		OtherOptions: {
			environment: 'development',
		},
		RequestOptions: {
			user: ['email', 'id'],
			ip: true,
		},
	},
	LocalIps: ['0.0.0.0', 'localhost'], // These are for local tests, and to allow the WebSocket to make HTTP requests to the server
};

const Encryption: EncrpytionConfigType = {
	Algorithm: 'aes-256-cbc',
	InitVector: '',
	SecurityKey: '',
	TokenKey: '',
};

const Ws: WsConfigType = {
	Url: 'ws://localhost:8080/system',
	Password: '123',
};

const Redis: RedisConfigType = {
	Host: 'localhost',
	Port: 6_379,
	Username: '',
	Password: '',
	DB: 0,
};

const ScyllaDB: ScyllaDBConfigType = {
	Nodes: ["localhost"],
	Keyspace: 'kastel',
	Username: 'kstl',
	Password: '',
	CassandraOptions: {},
	DurableWrites: true,
	NetworkTopologyStrategy: {}
};

const MailServer: MailServerConfigType = {
	Enabled: true,
	Users: [
		{
			Host: '',
			Port: 465,
			Secure: true,
			User: 'no-reply@kastelapp.com',
			Password: '',
			ShortCode: 'NoReply',
		},
		{
			Host: '',
			Port: 465,
			Secure: true,
			User: 'support@kastelapp.com',
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
	PlusReplace: /\+([^@]+)/g, // eslint-disable-line prefer-named-capture-group
	PasswordValidtor: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()-=_+{};:<>,.?/~]{6,72}$/g, // eslint-disable-line unicorn/better-regex
	EmailValidator: /^[\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,}$/g,
	UsernameValidator: /^(?=.*[a-zA-Z0-9!$%^&*()\-_~>.<?/\s\u0020-\uD7FF\uE000-\uFFFD])[a-zA-Z0-9!$%^&*()\-_~>.<?/\s\u0020-\uD7FF\uE000-\uFFFD]{2,30}$/g, // eslint-disable-line unicorn/better-regex
};

const Config: ConfigType = {
	Server,
	Encryption,
	Ws,
	Redis,
	ScyllaDB,
	Regexs,
	MailServer,
	EmailTemplates,
};

export { Config, Server, Encryption, Ws, Redis, ScyllaDB, Regexs, MailServer, EmailTemplates };

export default {
	Config,
	Server,
	Encryption,
	Ws,
	Redis,
	ScyllaDB,
	Regexs,
	MailServer,
	EmailTemplates,
};
