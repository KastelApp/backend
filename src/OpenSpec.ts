// TODO: Finish the OpenSpec file, this is a WIP

import { join } from "node:path";
import { URL } from "node:url";
import FileSystemRouter from "./Utils/Classes/FileSystemRouter.ts";
import Route from "./Utils/Classes/Routing/Route.ts";

const router = new FileSystemRouter({
	dir: join(new URL(".", import.meta.url).pathname, "./Routes"),
	style: "nextjs",
});

for (const [name, route] of Object.entries(router.routes)) {
	const routeClass = await import(route);

	if (!routeClass.default) {
		throw new Error(`Route ${name} does not have a default export, cannot generate spec`);
	}

	const routeInstance = new routeClass.default(); // Nothing gets ran so we don't need to provide an "App"

	if (!(routeInstance instanceof Route)) {
		throw new TypeError(`Route ${name} is not an instance of Route, cannot generate spec`);
	}

	console.log("Route", name, routeClass.default.name);
	console.log("Methods", routeInstance.__methods);
	console.log("Middlewares", routeInstance.__middlewares);
	console.log("Content Types", routeInstance.__contentTypes);
	console.log("Descriptions", routeInstance.__descriptions);
}
