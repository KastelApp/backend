import process from "node:process";
import API from "./Utils/Classes/API.ts";

const api = new API();

declare const self: Worker;

self.onmessage = (event: MessageEvent) => {
	if (event.data.type === "config") {
		postMessage({ type: "config", data: api.config });
	}
};

try {
	api.logo();

	await api.init();
} catch (error) {
	api.logger.fatal("A fatal error occurred before the server could start.");
	api.logger.fatal(error);

	process.exit(1);
}
