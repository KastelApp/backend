import { join } from "node:path";
import process from "node:process";
import type { MySchema } from "./Types/JsonSchemaType.ts";
import Logger from "./Utils/Classes/Logger.ts";
import RabbitMQ from "./Utils/Classes/Shared/RabbitMQ.ts";
import { isQuestion, isConfigResponse, isLog, isNewLog, isReady, isRabbitMqType, isHeartbeatMessage } from "./Utils/threadMessages.ts";

const getUrl = (url: string): string => join(import.meta.dirname, url);

/* Just praying no errors occur which crashes one of the workers since it will take the parent offline  */
const api = new Worker(getUrl("./api.ts"), { argv: process.argv });
const websocket = new Worker(getUrl("./websocket.ts"), { argv: process.argv });
const heartbeat = new Worker(getUrl("./heartbeat.ts"), { argv: process.argv });
const mainLogger = new Logger({}, "MIN");
let rabbitMq: RabbitMQ | null = null;

const data = {
	api: {
		port: 0,
		ready: false,
		config: {} as MySchema,
	},
	websocket: {
		port: 0,
		ready: false,
	},
};

const handleMessage = async (worker: "api" | "heartbeat" | "ws", event: MessageEvent) => {
	if (isLog(event.data)) {
		mainLogger.writingQueue.push(event.data.data);
	} else if (isQuestion(event.data)) {
		api.postMessage({ nonce: event.data.nonce, response: "I am a worker." });
	} else if (isReady(event.data)) {
		if (worker === "api") {
			data.api.ready = true;
			data.api.port = Number(event.data.data.port);
			api.postMessage({ type: "config" });
		} else {
			data.websocket.ready = true;
			data.websocket.port = Number(event.data.data.port);
		}

		if (data.websocket.ready && data.api.ready) {
			mainLogger.info(`API is ready on port ${data.api.port}`, `WebSocket is ready on port ${data.websocket.port}`);
		}
	} else if (isConfigResponse(event.data)) {
		data.api.config = event.data.data;

		if (rabbitMq) return;

		rabbitMq = new RabbitMQ(data.api.config);

		await rabbitMq.init();

		mainLogger.info("RabbitMQ is ready");

		rabbitMq.on("data", (data) => {
			websocket.postMessage(data);
		});
	} else if (isNewLog(event.data)) {
		mainLogger.info(...event.data.data);
	} else if (isRabbitMqType(event.data)) {
		if (rabbitMq) {
			rabbitMq.send(event.data.data.topic, event.data.data.data);
		}
	} else if(isHeartbeatMessage(event.data) && worker === "ws") {
		heartbeat.postMessage(event.data);
	} else if (worker === "heartbeat" && isHeartbeatMessage(event.data)) {
		websocket.postMessage(event.data);
	} else {
		mainLogger.error("Invalid", event.data);
	}
};

api.onmessage = async (event: MessageEvent) => handleMessage("api", event);
websocket.onmessage = async (event: MessageEvent) => handleMessage("ws", event);
heartbeat.onmessage = async (event: MessageEvent) => handleMessage("heartbeat", event);

api.onerror = (event: ErrorEvent) => {
	console.log(event.message);
};

websocket.onerror = (event: ErrorEvent) => {
	console.log(event.message);
};

heartbeat.onerror = (event: ErrorEvent) => {
	console.log(event.message);
};
