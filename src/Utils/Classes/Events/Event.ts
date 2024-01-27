import type { BodyValidator } from "@/Types/BodyValidation.ts";
import type WebSocket from "../WebSocket.ts";

class Event {
	public readonly App: WebSocket;

	public KillSwitched: boolean;

	public constructor(App: WebSocket) {
		this.App = App;

		this.KillSwitched = false;
	}
}

interface Decorators {
	__authRequired: {
		auth: boolean;
		name: string;
	}[];
	__descriptions: {
		// Description of the route method (for documentation)
		description: string;
		name: string;
	}[];
	__opcodes: {
		code: number;
		name: string;
	}[];
	__validator: {
		body: BodyValidator;
		name: string;
	}[];
}

interface Event extends Decorators {}

export default Event;

export { Event };
