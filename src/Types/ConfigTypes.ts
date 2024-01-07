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

import type { ClientOptions } from "@kastelll/cassandra-driver";
import type * as Sentry from "@sentry/node";

// Features for the API (So the frontend knows what to show)
export type Features =
	| "DisableChannelCreation"
	| "DisableEmailVerification"
	| "DisableGuildCreation"
	| "DisableLogin"
	| "DisablePasswordReset"
	| "DisableRegistration";

// omit the features thats already in the array

export interface Server {
	BucketInterval: number;
	BucketRnd: number;
	Cache: {
		ClearInterval: number;
		ClearOnStart: boolean;
	};
	// cloudflare turnstile secret (for captchas)
	CaptchaEnabled: boolean;
	CloudflareAccessOnly: boolean;
	Domain: string;
	Features: Features[];
	LocalIps?: string[];
	Port: number | string;
	Secure: boolean;
	// if true then some routes will require captcha (register, login, etc)
	Sentry: {
		Dsn: string;
		Enabled: boolean;
		OtherOptions: Exclude<Sentry.NodeOptions, "dsn" | "tracesSampleRate">;
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
	SecurityKey: string;
	TokenKey: string;
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

export interface ScyllaDB {
	CassandraOptions: Omit<ClientOptions, "credentials" | "keyspace">;
	DurableWrites: boolean;
	Keyspace: string;
	NetworkTopologyStrategy: {
		[DataCenter: string]: number;
	};
	Nodes: string[];
	Password: string;
	Username: string;
}

type ShortCode = "NoReply" | "Support";

interface User {
	Host: string;
	Password: string | undefined;
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
	EmailValidator: RegExp;
	PasswordValidtor: RegExp;
	PlusReplace: RegExp;
	UsernameValidator: RegExp;
}

export interface Config {
	EmailTemplates: EmailTemplates;
	Encryption: Encryption;
	MailServer: MailServer;
	Redis: Redis;
	Regexs: Regexs;
	ScyllaDB: ScyllaDB;
	Server: Server;
	Ws: Ws;
}
