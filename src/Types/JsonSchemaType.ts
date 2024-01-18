// ? EXPORTED FROM https://transform.tools/json-schema-to-typescript
export type ShortCode = "NoReply" | "Support";
export type Features =
	| "DisableChannelCreation"
	| "DisableEmailVerification"
	| "DisableGuildCreation"
	| "DisableLogin"
	| "DisablePasswordReset"
	| "DisableRegistration";

export interface MySchema {
	encryption: Encryption;
	mailServer?: MailServer;
	redis: Redis;
	scyllaDB: ScyllaDB;
	server: Server;
	ws: Ws;
}

export interface Encryption {
	algorithm: string;
	initVector: string;
	securityKey: string;
	tokenKey: string;
}

export interface MailServer {
	enabled?: boolean;
	users?: [User, User];
}

export interface User {
	host: string;
	password: string;
	port: number;
	secure: boolean;
	shortCode: ShortCode;
	user: string;
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
		[k: string]: number;
	};
	nodes: string[];
	password: string;
	username: string;
}

export interface Server {
	bucketInterval: number;
	bucketRnd: number;
	cache: {
		clearInterval: number;
		clearOnStart: boolean;
	};
	captchaEnabled: boolean;
	cloudflareAccessOnly: boolean;
	domain: string;
	features: Features[];
	localIps: string[];
	port: number | string;
	secure: boolean;
	sentry: {
		dsn: string;
		enabled: boolean;
		tracesSampleRate: number;
	};
	strictRouting: boolean;
	turnstileSecret: string;
	workerId: number;
}

export interface Ws {
	password: string;
	url: string;
	version: number;
}
