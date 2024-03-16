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
	bucketInterval: number;
	bucketRnd: number;
	cache: {
		clearInterval: number;
		clearOnStart: boolean;
	};
	// cloudflare turnstile secret (for captchas)
	captchaEnabled: boolean;
	cloudflareAccessOnly: boolean;
	domain: string;
	features: Features[];
	localIps?: string[];
	port: number | string;
	secure: boolean;
	// if true then some routes will require captcha (register, login, etc)
	sentry: {
		dsn: string;
		enabled: boolean;
		tracesSampleRate: number;
	};
	strictRouting: boolean;
	// if true then you cannot do like /users/@me/ you have to do /users/@me
	turnstileSecret: string | null;
	workerId?: number;
}

export interface Encryption {
	algorithm: string;
	initVector: string;
	securityKey: string;
	tokenKey: string;
}

export interface Ws {
	password: string;
	url: string;
	version?: number; // not required as most likely will be 0
}

export interface Redis {
	db: number;
	host: string;
	password: string;
	port: number;
	username: string;
}

export interface ScyllaDB {
	durableWrites: boolean;
	keyspace: string;
	networkTopologyStrategy: {
		[DataCenter: string]: number;
	};
	nodes: string[];
	password: string;
	username: string;
}

type ShortCode = "NoReply" | "Support";

interface User {
	host: string;
	password: string | undefined;
	port: number;
	secure: boolean;
	shortCode: ShortCode;
	username: string;
}

export interface MailServer {
	enabled: boolean;
	users: [User, User];
}
