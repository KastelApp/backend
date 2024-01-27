import { isMainThread } from "bun";
import WebSocket from "./Utils/Classes/WebSocket.ts";

const socket = new WebSocket();

try {
	if (isMainThread) socket.logo();

	await socket.init();
} catch (error) {
	console.log("A fatal error occurred before the server could start.");
	console.log(error);
}
