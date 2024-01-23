/* eslint-disable id-length */
import { join } from "node:path";
import process from "node:process";
import { cors } from "@elysiajs/cors";
import { serverTiming } from "@elysiajs/server-timing";
import { Turnstile } from "@kastelll/util";
import * as Sentry from "@sentry/bun";
import { isMainThread } from "bun";
import { Elysia } from "elysia";
import App from "./App.ts";
import errorGen from "./ErrorGen.ts";
import FileSystemRouter from "./FileSystemRouter.ts";
import { IpUtils } from "./IpUtils.ts";
import type { ContentTypes } from "./Routing/Route.ts";
import RouteBuilder from "./Routing/Route.ts";

class API extends App {
	private routeDirectory: string = join(import.meta.dirname, "../../Routes");

	public elysiaApp: Elysia;

	public turnstile!: Turnstile;

	public routeCache: Map<
		string,
		{
			path: string;
			route: string;
			routeClass: RouteBuilder;
		}
	> = new Map();

	public router: FileSystemRouter;

	public constructor() {
		super("API");

		this.elysiaApp = new Elysia();

		this.ipUtils = new IpUtils();

		this.sentry = Sentry;

		// this.Logger = new CustomLogger();

		this.router = new FileSystemRouter({
			dir: this.routeDirectory,
			style: "nextjs",
			watch: true,
			allowIndex: false,
		});
	}

	public override async init(): Promise<void> {
		await super.init();

		this.turnstile = new Turnstile(this.config.server.captchaEnabled, this.config.server.turnstileSecret ?? "secret");

		this.router.on("reload", async ({ path, type, directory }) => {
			this.logger.verbose(
				`Reloaded Routes due to a ${directory ? "directory" : "file"} (${path}) being ${
					type === "A" ? "Added" : type === "M" ? "Modified" : type === "D" ? "Removed" : "Unknown"
				}`,
			);

			if (!directory && type !== "D") {
				const loaded = await this.loadRoute(
					path,
					Object.keys(this.router.routes).find((route) => this.router.routes[route] === path) ?? "",
				);

				if (!loaded) {
					this.logger.warn(`Failed to load ${path}`);

					return;
				}

				this.logger.info(`Loaded ${loaded.route}`);
			}
		});

		this.elysiaApp
			.use(
				cors({
					methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
				}),
			)
			.use(serverTiming())
			.onError(({ code, request, path, error }) => {
				this.logger.error(`Error ${code} on route ${path} [${request.method}]`);

				console.log(error);

				return "Internal Server Error :(";
			});

		for (const [name, route] of Object.entries(this.router.routes)) {
			const loaded = await this.loadRoute(route, name);

			if (!loaded) {
				this.logger.warn(`Failed to load ${name}`);

				continue;
			}

			this.logger.info(`Loaded ${loaded.route}`);
		}

		this.logger.info(`Loaded ${Object.keys(this.router.routes).length} routes`);

		this.elysiaApp.all("*", async ({ body, headers, path, query, request, set, store }) => {
			const ip = IpUtils.getIp(request, this.elysiaApp.server) ?? "";
			const isLocalIp = IpUtils.isLocalIp(ip);
			const snf = this.snowflake.Generate();

			set.headers["x-request-id"] = snf;

			if (isLocalIp && process.env.NODE_ENV !== "development") {
				this.logger.warn(`Local IP ${ip} tried to access ${path}`);

				set.status = 403;

				return "Forbidden";
			}

			const matched = this.router.match(request);

			if (!matched) {
				const error = errorGen.NotFound();

				error.addError({
					notFound: {
						code: "NotFound",
						message: `Could not find route for ${request.method} ${path}`,
					},
				});

				return error.toJSON();
			}

			const route = this.routeCache.get(matched.filePath);

			if (!route) {
				this.logger.error(`Could not find route for ${request.method} ${path} but it was successfully matched`);

				return "Internal Server Error :(";
			}

			this.logger.info(`Request to "${route.route}" [${request.method}]`);

			const foundMethod = route.routeClass.__methods?.find(
				(method) => method.method === request.method.toLowerCase(),
			) ?? { name: "Request", method: "get" };

			if (!foundMethod) {
				const error = errorGen.MethodNotAllowed();

				error.addError({
					methodNotAllowed: {
						code: "MethodNotAllowed",
						message: `Method "${
							request.method
						}" is not allowed for "${path}", allowed methods are [${route.routeClass.__methods
							.map((method) => method.method.toUpperCase())
							.join(", ")}]`,
					},
				});

				return error.toJSON();
			}

			const middleware = route.routeClass.__middlewares?.filter((middleware) => middleware.name === foundMethod.name);
			const contentTypes = route.routeClass.__contentTypes?.find(
				(contentType) => contentType.name === foundMethod.name,
			);

			// @ts-expect-error -- I know what I'm doing
			if (route.routeClass[foundMethod.name] === undefined) {
				this.logger.error(`Could not find function for ${request.method} ${path} but it was successfully matched`);

				return "Internal Server Error :(";
			}

			// @ts-expect-error -- I know what I'm doing
			const routeClassFunction = route.routeClass[foundMethod.name].bind(route.routeClass);
			const finishedMiddlewares = [];

			if (!routeClassFunction) {
				this.logger.error(`Could not find function for ${request.method} ${path} but it was successfully matched`);

				return "Internal Server Error :(";
			}

			if (
				contentTypes &&
				contentTypes.type.length > 0 &&
				!contentTypes.type.includes((headers["content-type"] ?? "text/plain") as ContentTypes) &&
				!contentTypes.type.includes("any")
			) {
				const error = errorGen.InvalidContentType();

				error.addError({
					contentType: {
						code: "InvalidContentType",
						message: `Invalid Content-Type header, Expected (${contentTypes.type.join(", ")}), Got (${
							headers["content-type"]
						})`,
					},
				});

				set.status = 400;
				set.headers["Content-Type"] = "application/json";

				this.logger.info(
					`Request to "${route.route}" [${request.method}] finished with status ${set.status} from invalid content type`,
				);

				return error.toJSON();
			}

			if (this.args.includes("debug")) this.logger.startTimer(`[Request] Middleware ${snf}`);

			if (middleware && middleware.length > 0) {
				for (const middle of middleware) {
					const finished = await middle.ware({
						app: this,
						body: body as {},
						headers,
						params: matched.params,
						path,
						query,
						request,
						set,
						store,
						ip,
					});

					if (set.status !== 200) {
						this.logger.info(
							`Request to "${route.route}" [${request.method}] finished with status ${set.status} from middleware ${middle.ware.name}`,
						);

						return finished;
					}

					finishedMiddlewares.push(finished);
				}
			}

			if (this.args.includes("debug")) this.logger.stopTimer(`[Request] Middleware ${snf}`);
			if (this.args.includes("debug")) this.logger.startTimer(`[Request] Route ${snf}`);

			const requested = (await routeClassFunction({
				app: this,
				body: body as {},
				headers,
				params: matched.params,
				path,
				query,
				request,
				set,
				store,
				ip,
				...finishedMiddlewares.reduce((a, b) => ({ ...a, ...b }), {}),
			})) as Promise<unknown>;

			if (typeof requested === "object") {
				// Go through requested, we want to alert the console when we detect an "email, phone number, password" field in the response
				// There will be whitelisted paths, such as /auth/register, /users/@me etc
				// If we detect one we warn it to the console then return a 500 error
				const whitelistedPaths = ["/auth/register", "/users/@me"];

				const checked = this.checkObjectForBlacklistedFields(requested, ["email", "phoneNumber", "password"]);

				if (checked && !(whitelistedPaths.includes(path) || whitelistedPaths.includes(path.slice(3)))) {
					set.status = 500;

					this.logger.warn(`Blacklisted field detected in response for ${path}`);

					return "Internal Server Error :(";
				}
			}

			if (this.args.includes("debug")) this.logger.stopTimer(`[Request] Route ${snf}`);

			this.logger.info(`Request to "${route.route}" [${request.method}] finished with status ${set.status}`);

			return requested;
		});

		this.elysiaApp.listen(this.config.server.port, () => {
			if (isMainThread) this.logger.info(`Listening on port ${this.config.server.port}`);
			else postMessage({ type: "ready", data: { port: this.config.server.port } });
		});
	}

	private async loadRoute(path: string, route: string) {
		if (this.routeCache.has(path)) {
			this.routeCache.delete(path);
		}

		// this is a hack to make sure it doesn't cache the file
		const routeClass = (await import(`${path}?t=${Date.now()}`)) as { default: typeof RouteBuilder };

		if (!routeClass.default) {
			this.logger.warn(`Skipping ${path} as it does not have a default export`);

			return null;
		}

		const routeInstance = new routeClass.default(this);

		if (!(routeInstance instanceof RouteBuilder)) {
			this.logger.warn(`Skipping ${path} as it does not extend Route`);

			return null;
		}

		this.routeCache.set(path, {
			path,
			route,
			routeClass: routeInstance,
		});

		return this.routeCache.get(path);
	}
}

export default API;

export { API };
