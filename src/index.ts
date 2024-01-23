import { join } from "node:path";
import process from "node:process";
import Logger from "./Utils/Classes/Logger.ts";

const getUrl = (url: string): string => join(import.meta.dirname, url);

const isImportant = (data: unknown): data is { data: unknown; type: string } => {
	if (typeof data !== "object") return false;

	if (data === null) return false;

	if (!("type" in data)) return false;

	if (typeof data.type !== "string") return false;

	return "data" in data;
};

const isLog = (data: unknown): data is { data: { file: "error" | "latest"; message: string[] }; type: "log" } => {
	if (!isImportant(data)) return false;

	if (data.type !== "log") return false;

	return "data" in data;
};

const isQuestion = (data: unknown): data is { nonce: string; question: string } => {
	if (typeof data !== "object") return false;

	if (data === null) return false;

	if (!("nonce" in data)) return false;

	if (typeof data.nonce !== "string") return false;

	return "question" in data;
};

const isReady = (data: unknown): data is { data: { port: number | string }; type: "ready" } => {
	if (!isImportant(data)) return false;

	if (data.type !== "ready") return false;

	return "data" in data;
};

/* Just praying no errors occur which crashes one of the workers since it will take the parent offline  */
const api = new Worker(getUrl("./api.ts"), { argv: process.argv });
const websocket = new Worker(getUrl("./websocket.ts"), { argv: process.argv });
const mainLogger = new Logger({}, "MIN");

const data = {
	api: {
		port: 0,
		ready: false,
	},
	websocket: {
		port: 0,
		ready: false,
	},
};

api.onmessage = (event: MessageEvent) => {
	if (isLog(event.data)) {
		mainLogger.writingQueue.push(event.data.data);
	} else if (isQuestion(event.data)) {
		api.postMessage({ nonce: event.data.nonce, response: "I am a worker." });
	} else if (isReady(event.data)) {
		data.api.ready = true;
		data.api.port = Number(event.data.data.port);

		if (data.websocket.ready) {
			mainLogger.info(`API is ready on port ${data.api.port}`, `WebSocket is ready on port ${data.websocket.port}`);
		}
	} else {
		console.log(event.data);
	}
};

websocket.onmessage = (event: MessageEvent) => {
	if (isLog(event.data)) {
		mainLogger.writingQueue.push(event.data.data);
	} else if (isQuestion(event.data)) {
		websocket.postMessage({ nonce: event.data.nonce, response: "I am a worker." });
	} else if (isReady(event.data)) {
		data.websocket.ready = true;
		data.websocket.port = Number(event.data.data.port);

		if (data.api.ready) {
			mainLogger.info(`API is ready on port ${data.api.port}`, `WebSocket is ready on port ${data.websocket.port}`);
		}
	} else {
		console.log(event.data);
	}
};

api.onerror = (event: ErrorEvent) => {
	console.log(event);
};

websocket.onerror = (event: ErrorEvent) => {
	console.log(event);
};
