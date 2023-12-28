import type { CookieOptions } from "elysia";
import type { Prettify } from "elysia/types";
import type { HTTPStatusName } from "elysia/utils";
import type { GetParams } from "@/Types/Routes.ts";
import type App from "./App.ts";

type Method = "all" | "delete" | "get" | "head" | "options" | "patch" | "post" | "put";

type ContentTypes =
	| "application/javascript"
	| "application/json"
	| "application/octet-stream"
	| "application/x-www-form-urlencoded"
	| "application/zip"
	| "audio/mpeg"
	| "audio/ogg"
	| "audio/wav"
	| "audio/webm"
	| "image/gif"
	| "image/jpeg"
	| "image/png"
	| "image/webp"
	| "multipart/form-data"
	| "text/html"
	| "text/plain"
	| "video/mp4"
	| "video/ogg"
	| "video/quicktime"
	| "video/webm"

type CreateMiddleware<ExtraOptions extends Record<string, any> | string = Record<string, any>> = ExtraOptions;

interface CreateRouteOptions<Route extends string, Body extends Record<string, boolean | number | string | null | undefined> | unknown = unknown, params extends string[] = []> {
	app: App;
	body: Body;
	headers: Record<string, string | undefined>;
	params: GetParams<Route> & ParamsArray<params>;
	path: Route;
	query: Record<string, string | undefined>;
	request: globalThis.Request;
	set: {
		cookie?: Record<string, Prettify<CookieOptions & {
			value: string;
		}>>;
		headers: Record<string, string> & {
			"Set-Cookie"?: string[] | string;
		};
		redirect?: string;
		status?: HTTPStatusName | number;
	};
	store: {};
}

type MiddlewareArray<Arr extends Record<string, unknown>[]> = Arr extends [infer First, ...infer Rest]
	? First extends Record<string, unknown>
	? Rest extends Record<string, unknown>[]
	? CreateMiddleware<First> & MiddlewareArray<Rest>
	: never
	: never
	: {};

// turn this into an object from an array
type ParamsArray<Arr extends string[]> = Arr extends [infer First, ...infer Rest]
	? First extends string
	? Rest extends string[]
	? ParamsArray<Rest> & Record<First, string>
	: never
	: never
	: {};

type CreateRoute<Route extends string = string, Body extends Record<string, boolean | number | string | null | undefined> | unknown = unknown, MiddlewareSettings extends Record<string, unknown>[] = [], params extends string[] = []> = CreateRouteOptions<Route, Body, params> & MiddlewareArray<MiddlewareSettings>;

class Route {
	public readonly App: App;

	public Middleware: ((req: CreateRouteOptions<string, {}>) => CreateMiddleware | Promise<CreateMiddleware>)[];

	public Route: {
		ContentTypes: ContentTypes[];
		Method: Method;
		Path: string;
	}[];

	public KillSwitched: boolean; // KillSwitched routes will be populated in the routes, though when someone tries to use it, we'll return a 503 error (default is false)

	public constructor(App: App) {
		this.App = App;

		this.Route = [];

		this.KillSwitched = false;

		this.Middleware = [];
	}


	public Request(req: any) {
		return req;
	}
}

export default Route;

export type { Route, Method, ContentTypes, CreateRouteOptions, CreateRoute, CreateMiddleware };
