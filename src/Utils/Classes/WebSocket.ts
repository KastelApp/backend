import { join } from "node:path";
import { isMainThread, type Server } from "bun";
import App from "./App.ts";
import EventBuilder from "./Events/Event.ts";
import type { WsOptions } from "./Events/User.ts";
import User from "./Events/User.ts";
import FileSystemRouter from "./FileSystemRouter.ts";

class WebSocket extends App {
	private eventDirectory: string = join(import.meta.dirname, "../../Events");

	public mainSocket!: Server;

	public topics: Map<string, Set<User>> = new Map();

	public router: FileSystemRouter;

	public eventCache: Map<
		number,
		{
			eventClass: EventBuilder;
			file: string;
			opCode: number;
		}
	> = new Map();

	public constructor() {
		super("WSS");

		this.logger.colorTypes = {
			...this.logger.colorTypes,
			info: "#158aad",
		};

		this.router = new FileSystemRouter({
			dir: this.eventDirectory,
			style: "nextjs",
			watch: true,
			allowIndex: false,
		});
	}

	public override async init(): Promise<void> {
		await super.init();

		this.mainSocket = Bun.serve<WsOptions>({
			port: this.config.ws.port,
			websocket: {
				message: (ws, message) => {
					console.log(message, ws.data.user);
				},
				open: (ws) => {
					const newUser = new User(this).setWs(ws);

					console.log(newUser);

					ws.data.user = newUser;
				},
			},
			hostname: "0.0.0.0",
			fetch: (request, server) => {
				console.log(request);

				server.upgrade<WsOptions>(request, {
					data: {
						headers: request.headers,
						sessionId: "",
						url: request.url,
						user: null!,
					},
				});
			},
		});

		for (const [name, route] of Object.entries(this.router.routes)) {
			const loaded = await this.loadEvents(route);

			if (!loaded) {
				this.logger.warn(`Failed to load ${name}`);

				continue;
			}

			this.logger.info(`Loaded ${loaded}`);
		}

		if (isMainThread) this.logger.info(`Listening on port ${this.config.ws.port}`);
		else postMessage({ type: "ready", data: { port: this.config.ws.port } });
	}

	private async loadEvents(path: string) {
		// this is a hack to make sure it doesn't cache the file
		const eventClass = (await import(`${path}?t=${Date.now()}`)) as { default: typeof EventBuilder };

		if (!eventClass.default) {
			this.logger.warn(`Skipping ${path} as it does not have a default export`);

			return null;
		}

		const routeInstance = new eventClass.default(this);

		if (!(routeInstance instanceof EventBuilder)) {
			this.logger.warn(`Skipping ${path} as it does not extend Events`);

			return null;
		}

		console.log(routeInstance.__opcodes);
	}

	public getSessionId() {
		return App.snowflake.Generate();
	}

	public getHeartbeatInterval() {
		const maxInterval = 1_000 * 45; // 45 seconds
		const minimumInterval = 1_000 * 35; // 35 seconds

		const interval = Math.floor(Math.random() * (maxInterval - minimumInterval + 1) + minimumInterval);

		return Math.round(interval);
	}
}

export default WebSocket;

export { WebSocket };
