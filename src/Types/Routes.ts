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

import type { permissions, privateFlags } from "../Constants.ts";

export type Methods =
	| "ALL"
	| "all"
	| "DELETE"
	| "delete"
	| "GET"
	| "get"
	| "HEAD"
	| "head"
	| "OPTIONS"
	| "options"
	| "PATCH"
	| "patch"
	| "POST"
	| "post"
	| "PURGE"
	| "purge"
	| "PUT"
	| "put";

type Requesters = "All" | "Bot" | "OAuth" | "User" | "Webhook";

export type OAuth2Scopes = "user.guilds" | "user.identity.email" | "user.identity";

export interface UserMiddleware {
	// The flags required to access the endpoint (Default: null)
	// If you need to be logged in to access the endpoint
	AccessType: "All" | "LoggedIn" | "LoggedOut";
	AllowedRequesters: Requesters | Requesters[];
	// The flags that are not allowed to access the endpoint (Default: null)
	DisallowedFlags?: (keyof typeof privateFlags)[];
	// The type of user that can access the endpoint (Default: 'All')
	Flags?: (keyof typeof privateFlags)[];
	OAuth2Scopes?: OAuth2Scopes[];
}

export interface GuildMiddleware {
	PermissionsRequired?: (keyof typeof permissions | "Owner")[];
	Required: boolean;
}

export interface Captcha {
	// The expected cdata of the captcha (done client side) (session id stuffs)
	BodyTrigger?: string[];
	// If the captcha is enabled
	Enabled: boolean;
	// The expected action of the captcha (login, register, etc.) (done client side)
	ExpectedAction?: string;
	// The body key that triggers the captcha (like the username field or password field etc)
	ExpectedCData?: string;
}

type GetParam<T extends string> = T extends `${infer _}/${infer _2}:${infer Param}/${infer _3}`
	? Record<Param, string>
	: T extends `${infer _}:${infer Param}/${infer _2}`
	? Record<Param, string>
	: T extends `${infer _}/${infer _2}:${infer Param}`
	? Record<Param, string>
	: T extends `${infer _}:${infer Param}`
	? Record<Param, string>
	: {};

export type GetParams<T extends string> = GetParam<T> &
	(T extends `${infer _}/${infer Rest}`
		? GetParams<Rest>
		: T extends `${infer _}:${infer Rest}`
		? GetParams<Rest>
		: {});
