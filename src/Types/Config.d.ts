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

import type * as Sentry from '@sentry/node';

export interface Server {
	Cache: {
		ClearInterval: number;
		ClearOnStart: boolean;
	};
	// cloudflare turnstile secret (for captchas)
	CaptchaEnabled: boolean;
	CookieSecrets: string[];
	Domain: string;
	LocalIps?: string[];
	Port?: number | string;
	Secure: boolean;
	// if true then some routes will require captcha (register, login, etc)
	Sentry: {
		Dsn: string;
		Enabled: boolean;
		OtherOptions: Exclude<Sentry.NodeOptions, 'dsn' | 'tracesSampleRate'>;
		RequestOptions: Sentry.Handlers.RequestHandlerOptions;
		TracesSampleRate: number;
	};
	StrictRouting: boolean;
	// if true then you cannot do like /users/@me/ you have to do /users/@me
	TurnstileSecret: string | null;
	WorkerId?: number;
}

export interface Encryption {
	Algorithm: string;
	InitVector: string;
	JwtKey: string;
	SecurityKey: string;
}

export interface Ws {
	Password: string;
	Url: string;
	version?: number; // not required as most likely will be 0
}

export interface Redis {
	DB: number;
	Host: string;
	Password: string;
	Port: number;
	Username: string;
}

export interface MongoDB {
	AuthSource: string;
	Database: string;
	Host: string;
	Password: string;
	Port: number | string;
	Uri: string;
	User: string;
}

type ShortCode = 'NoReply' | 'Support';

interface User {
	Host: string;
	Password: string;
	Port: number;
	Secure: boolean;
	ShortCode: ShortCode;
	User: string;
}

export interface MailServer {
	Enabled: boolean;
	Users: [User, User];
}

export interface EmailTemplates {
	DisabledAccount: DisabledAccount;
	ResetPassword: ResetPassword;
	VerifyEmail: VerifyEmail;
}

interface VerifyEmail {
	PlaceHolders: {
		SupportEmail: string;
		Username: string;
		VerifyLink: string;
	};
	Subject: string;
	Template: string;
}

interface ResetPassword {
	PlaceHolders: {
		ResetLink: string;
		SupportEmail: string;
		Username: string;
	};
	Subject: string;
	Template: string;
}

interface DisabledAccount {
	PlaceHolders: {
		Reason: string;
		SupportEmail: string;
		Uusername: string;
	};
	Subject: string;
	Template: string;
}

export interface Regexs {
	Email: RegExp;
	Password: RegExp;
}

export interface Config {
	EmailTemplates: EmailTemplates;
	Encryption: Encryption;
	MailServer: MailServer;
	MongoDB: MongoDB;
	Redis: Redis;
	Regexs: Regexs;
	Server: Server;
	Ws: Ws;
}
