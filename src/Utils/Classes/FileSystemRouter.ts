/* eslint-disable n/no-sync */
import fs from "node:fs";
import { URL } from "node:url";
import { watch } from "chokidar";

// ! Based off of Bun's router, but changed reload

interface Reload {
	directory?: boolean;
	path: string;
	type: "A" | "D" | "M" | "RN";
}

class FileSystemRouter {
	public routes: Record<string, string> = {};

	private readonly dir: string;

	public readonly style: "nextjs";

	private readonly origin: string;

	public readonly assetPrefix: string | null;

	private readonly fileExtensions: string[];

	private readonly allowIndex: boolean;

	private readonly watch: boolean;

	private listeners: Record<string, ((reload: Reload) => void)[]> = {};

	public constructor(parms: {
		allowIndex?: boolean;
		assetPrefix?: string;
		dir: string;
		fileExtensions?: string[];
		origin?: string;
		style: "nextjs";
		watch?: boolean;
	}) {
		this.dir = parms.dir;
		this.style = parms.style;
		this.origin = parms.origin ?? "http://localhost:3000";
		this.assetPrefix = parms.assetPrefix ?? null;
		this.fileExtensions = parms.fileExtensions ?? [".tsx", ".jsx", ".ts", ".mjs", ".cjs", ".js"];
		this.allowIndex = parms.allowIndex ?? true;
		this.watch = parms.watch ?? false;

		if (typeof this.dir !== "string") {
			throw new TypeError("Expected dir to be a string");
		}

		if (typeof this.origin !== "string") {
			throw new TypeError("Expected origin to be a string");
		}

		this.reload();

		if (this.watch) this.setupWatcher();
	}

	public on(event: "reload", listener: (reload: Reload) => void): this {
		this.listeners[event] = [...(this.listeners[event] ?? []), listener];

		return this;
	}

	public emit(event: "reload", reload: Reload): boolean {
		for (const listener of this.listeners[event] ?? []) {
			listener(reload);
		}

		return true;
	}

	public setupWatcher() {
		// ? Basically, we will watch the directory for changes, and if there are any, we will reload the routes
		const watcher = watch(this.dir, {
			ignoreInitial: true,
			ignored: /(?<dotfiles>^|[/\\])\../, // ignore dotfiles
			persistent: true,
		});

		watcher.on("all", (event, path) => {
			this.reload();

			const type: Reload["type"] =
				event === "add"
					? "A"
					: event === "addDir"
						? "A"
						: event === "change"
							? "M"
							: event === "unlink"
								? "D"
								: event === "unlinkDir"
									? "D"
									: "A";

			this.emit("reload", { path, type, directory: event === "addDir" || event === "unlinkDir" });
		});
	}

	public reload() {
		const files = this.recursiveReadDir(this.dir);

		this.routes = {}; // reset routes

		for (const file of files) {
			const route = file.slice(this.dir.length + 1, file.lastIndexOf("."));

			const fixedRoute = this.fixRoute(route);

			this.routes[fixedRoute] = file;

			const err = this.checkForErrors(fixedRoute);

			if (err) {
				throw new Error(err);
			}
		}
	}

	private fixRoute(route: string): string {
		if (!route.startsWith("/")) {
			return this.fixRoute(`/${route}`);
		}

		if (route.endsWith("/index")) {
			return this.fixRoute(route.slice(0, route.length - 6));
		}

		return route.trim().length === 0 ? "/" : route;
	}

	private recursiveReadDir(dir: string, files: string[] = []): string[] {
		return fs
			.readdirSync(dir, { withFileTypes: true })
			.flatMap((dirent) =>
				dirent.isDirectory()
					? this.recursiveReadDir(`${dir}/${dirent.name}`, files)
					: !dirent.name.startsWith(".") &&
						  this.fileExtensions.includes(dirent.name.slice(dirent.name.lastIndexOf(".")))
						? `${dir}/${dirent.name}`
						: [],
			);
	}

	public match(path: Request | Response | string): {
		filePath: string;
		kind: "catch-all" | "dynamic" | "exact" | "optional-catch-all";
		name: string;
		params: Record<string, string>;
		pathname: string;
		query: Record<string, string>;
		src: string;
	} | null {
		let ourPath = typeof path === "string" ? path : path.url;

		if (typeof ourPath !== "string") {
			throw new TypeError("Expected path to be a string");
		}

		ourPath = ourPath.replace(/\/$/, "").trim().length === 0 ? "/" : ourPath.replace(/\/$/, "");

		if (this.allowIndex && ourPath.endsWith("/index")) {
			return null;
		}

		const url = new URL(ourPath, this.origin);
		const pathname = url.pathname;

		const exactMatch = this.findExactMatch(pathname);

		if (exactMatch) {
			return {
				filePath: this.routes[exactMatch] as string,
				kind: "exact",
				name: exactMatch,
				params: {},
				pathname,
				query: Object.fromEntries(url.searchParams.entries()),
				src: this.getBuiltUrl(exactMatch, this.routes[exactMatch] as string),
			};
		}

		const matched = this.matchDynamicRoute(ourPath);

		if (matched.length === 0) {
			return null;
		}

		return matched[0] as any;
	}

	private matchDynamicRoute(pathname: string): {
		filePath: string;
		kind: "catch-all" | "dynamic" | "exact" | "optional-catch-all";
		name: string;
		params?: Record<string, string>;
		pathname: string;
		query?: Record<string, string>;
		src: string;
	}[] {
		const foundRoutes: {
			filePath: string;
			kind: "catch-all" | "dynamic" | "exact" | "optional-catch-all";
			name: string;
			params?: Record<string, string>;
			pathname: string;
			query?: Record<string, string>;
			src: string;
		}[] = [];
		for (const route of Object.keys(this.routes)) {
			const converted = this.convert(route);

			const regex = new RegExp(`^${converted.regex}$`, "i");

			const url = new URL(pathname, this.origin);

			const match = url.pathname.match(regex);

			if (match) {
				const params: Record<string, string> = {};

				for (const [i, name] of converted.slugNames.entries()) {
					params[name] = match[i + 1] ?? "";
				}

				let rt = route;

				if (converted.type === "optional-catch-all") {
					const routeParts = rt.split("/");
					const inputParts = pathname.split("/");

					for (let i = 0; i < routeParts.length; i++) {
						if (routeParts[i] === "[[...id]]" && !inputParts[i]) {
							routeParts.splice(i, 1);
							break;
						}
					}

					rt = routeParts.join("/");
				}

				for (const [key, value] of Object.entries(params)) {
					// * hacky way to fix params

					if (key.startsWith("...")) {
						params[key.slice(3)] = value;
						// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
						delete params[key];
					}
				}

				foundRoutes.push({
					filePath: this.routes[route] as string,
					kind: converted.type,
					name: rt,
					params,
					pathname: url.pathname,
					query: {
						...params, // ?????????? this is stupid bun, its so annoying
						...Object.fromEntries(url.searchParams.entries()),
					},
					src: this.getBuiltUrl(route, this.routes[route] as string),
				});
			}
		}

		return foundRoutes;
	}

	private getBuiltUrl(route: string, file: string): string {
		let assetUrl = this.assetPrefix;

		if (assetUrl) {
			if (assetUrl.startsWith("/")) {
				assetUrl = assetUrl.slice(1);
			}

			if (assetUrl.endsWith("/")) {
				assetUrl = assetUrl.slice(0, assetUrl.length - 1);
			}
		}

		let newRoute = `${assetUrl ? assetUrl + "/" : ""}${route}`;

		if (assetUrl) {
			const ext = file.slice(file.lastIndexOf("."));

			newRoute += ext;
		}

		// remove any extra slashes
		return new URL(newRoute.replaceAll(/\/+/g, "/"), this.origin).toString();
	}

	private findExactMatch(pathname: string): string | null {
		const exactMatch = Object.keys(this.routes).find((route) => {
			if (pathname.endsWith("/index")) {
				const sliced = pathname.slice(0, pathname.length - 6).trim();

				return sliced.length === 0 ? route === "/" : route === sliced;
			}

			return pathname === route;
		});

		return exactMatch ?? null;
	}

	private convert(route: string): {
		regex: string;
		slugNames: string[];
		type: "catch-all" | "dynamic" | "exact" | "optional-catch-all";
	} {
		let regex = route;

		// Convert [[...slug]] to an optional catch-all regex
		regex = regex.replaceAll(/\[\[\.\.\.(?<optionalcatchall>.*?)]]/g, "(.*?)()?");

		// Convert [...slug] to a catch-all regex
		regex = regex.replaceAll(/\[\.{3}(?<catchall>.*?)]/g, "(.*?)");

		// Convert [slug] to a dynamic segment regex
		regex = regex.replaceAll(/\[(?<dynamic>.*?)]/g, "([^/]+?)");

		const slugNames =
			route.match(/\[(?<slug>.*?)]/g)?.map((s) => {
				const cut = s.slice(1, s.length - 1);

				return cut.startsWith("[...") ? cut.slice(4) : cut;
			}) ?? [];

		return {
			regex,
			type: this.getRouteType(route),
			slugNames,
		};
	}

	public checkForErrors(route: string): string | null {
		// 1: Catch-all route must be at the end of the path
		if (route.includes("[[...")) {
			const fixedRoute = route.replaceAll(/\[\[\.\.\.[A-Za-z]+]]/g, "[[...]]");

			if (!fixedRoute.endsWith("[[...]]")) {
				return "Catch-all route must be at the end of the path";
			}
		}

		// 2: Invalid catch-all route, e.g. should be [...param]
		if (route.includes("[...") && !/\[\.{3}[A-Za-z]+]/.test(route)) {
			return "Invalid catch-all route, should be [...param]";
		}

		// 3: Invalid optional catch-all route, e.g. should be [[...param]]
		if (route.includes("[[...") && !/\[\[\.\.\.[A-Za-z]+]]/.test(route)) {
			return "Invalid optional catch-all route, should be [[...param]]";
		}

		// 4: Invalid dynamic route
		// we got to make sure its not a catch-all or optional catch-all
		if (
			route.includes("[") &&
			!/\[[A-Za-z]+]/.test(route) &&
			!/\[\.{3}[A-Za-z]+]/.test(route) &&
			!/\[\[\.\.\.[A-Za-z]+]]/.test(route)
		) {
			return "Invalid dynamic route";
		}

		// 5: Route is missing a parameter name, e.g. [param]
		if (route.includes("[]")) {
			return "Route is missing a parameter name, e.g. [param]";
		}

		// 6: Route is missing a closing bracket
		if ((route.match(/\[/g) || []).length !== (route.match(/]/g) || []).length) {
			return "Route is missing a closing bracket";
		}

		return null;
	}

	private getRouteType(route: string): "catch-all" | "dynamic" | "exact" | "optional-catch-all" {
		if (route.includes("[[...")) {
			return "optional-catch-all";
		}

		if (route.includes("[...")) {
			return "catch-all";
		}

		if (route.includes("[")) {
			return "dynamic";
		}

		return "exact";
	}
}

export default FileSystemRouter;
