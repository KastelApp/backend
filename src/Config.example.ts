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
} from "./Types/ConfigTypes";

const server: ServerConfigType = {
	Port: 62_250,
	Domain: "example.com",
	Secure: true, // https or http
	WorkerId: 1,
	BucketInterval: 1_000 * 60 * 60 * 24 * 14, // 14 days
	BucketRnd: 9_211_111_198,
	Cache: {
		ClearInterval: 1_000 * 60 * 60 * 6, // six hours
		ClearOnStart: false,
	},
	CloudflareAccessOnly: false,
	StrictRouting: true,
	CaptchaEnabled: true,
	TurnstileSecret: "",
	Sentry: {
		Enabled: true,
		Dsn: "",
		TracesSampleRate: 1,
		OtherOptions: {
			environment: "development",
		},
		RequestOptions: {
			user: [],
			ip: true,
		},
	},
	LocalIps: [""], // These are for local tests, and to allow the WebSocket to make HTTP requests to the server
	Features: ["DisableEmailVerification", "DisablePasswordReset"],
};

const encryption: EncrpytionConfigType = {
	Algorithm: "",
	InitVector: "",
	SecurityKey: "",
	TokenKey: "",
};

const ws: WsConfigType = {
	Url: "wss://example.com/system",
	Password: "123",
};

const redis: RedisConfigType = {
	Host: "",
	Port: 9_999,
	Username: "",
	Password: "",
	DB: 6,
};

const scyllaDB: ScyllaDBConfigType = {
	Nodes: [""],
	Keyspace: "",
	Username: "",
	Password: "",
	CassandraOptions: {},
	DurableWrites: true,
	NetworkTopologyStrategy: {},
};

const mailServer: MailServerConfigType = {
	Enabled: true,
	Users: [
		{
			Host: "localhost",
			Port: 1_025,
			Secure: false,
			User: "no-reply@kastelapp.com",
			Password: undefined,
			ShortCode: "NoReply",
		},
		{
			Host: "localhost",
			Port: 1_025,
			Secure: false,
			User: "support@kastelapp.com",
			Password: undefined,
			ShortCode: "Support",
		},
	],
};

const emailTemplates: EmailTemplatesConfigType = {
	VerifyEmail: {
		Subject: "Verify your email",
		Template: "", // can be a url or a file path
		PlaceHolders: {
			Username: "{{USERNAME}}",
			VerifyLink: "{{VERIFICATION_LINK}}",
			SupportEmail: "{{SUPPORT_EMAIL}}",
		},
	},
	ResetPassword: {
		Subject: "Reset your password",
		Template: "https://example.com", // can be a url or a file path
		PlaceHolders: {
			Username: "{{USERNAME}}",
			ResetLink: "{{RESET_LINK}}",
			SupportEmail: "{{SUPPORT_EMAIL}}",
		},
	},
	DisabledAccount: {
		Subject: "Your account has been disabled",
		Template: "https://example.com", // can be a url or a file path
		PlaceHolders: {
			Uusername: "{{USERNAME}}",
			SupportEmail: "{{SUPPORT_EMAIL}}",
			Reason: "{{REASON}}", // Can Be HTML
		},
	},
};

const regexs: RegexsConfigType = {
	PlusReplace: /\+([^@]+)/g, // eslint-disable-line prefer-named-capture-group
	PasswordValidtor: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()-=_+{};:<>,.?/~]{6,72}$/g, // eslint-disable-line unicorn/better-regex
	EmailValidator: /^[\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,}$/g,
	UsernameValidator:
		/^(?=.*[a-zA-Z0-9!$%^&*()\-_~>.<?/\s\u0020-\uD7FF\uE000-\uFFFD])[a-zA-Z0-9!$%^&*()\-_~>.<?/\s\u0020-\uD7FF\uE000-\uFFFD]{2,30}$/g, // eslint-disable-line unicorn/better-regex
};

const config: ConfigType = {
	Server: server,
	Encryption: encryption,
	Ws: ws,
	Redis: redis,
	ScyllaDB: scyllaDB,
	Regexs: regexs,
	MailServer: mailServer,
	EmailTemplates: emailTemplates,
};

export { config, server, encryption, ws, redis, scyllaDB, regexs, mailServer, emailTemplates };

export default {
	config,
	server,
	encryption,
	ws,
	redis,
	scyllaDB,
	regexs,
	mailServer,
	emailTemplates,
};
