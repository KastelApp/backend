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

import type { Permissions, PrivateFlags } from "../Constants.ts";
import type App from "../Utils/Classes/App.ts";

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

export interface UserMiddleware {
	// The flags required to access the endpoint (Default: null)
	// If you need to be logged in to access the endpoint
	AccessType: "All" | "LoggedIn" | "LoggedOut";
	AllowedRequesters: "All" | "Bot" | "User";
	// The flags that are not allowed to access the endpoint (Default: null)
	App: App;
	DisallowedFlags?: (keyof typeof PrivateFlags)[];
	// The type of user that can access the endpoint (Default: 'All')
	Flags?: (keyof typeof PrivateFlags)[];
}

export interface GuildMiddleware {
	App: App;
	PermissionsRequired?: (keyof typeof Permissions | "Owner")[];
	Required: boolean;
}

export interface TwofaMiddleware {
	App: App;
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

export interface RatelimitConfig {
	App: App;
}
