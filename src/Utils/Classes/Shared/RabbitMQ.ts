import { Buffer } from "node:buffer";
import { TextEncoder, TextDecoder } from "node:util";
import amqplib from "amqplib";
import type { MySchema } from "@/Types/JsonSchemaType.ts";

// ! Whats the point in this class?
// ? Instead of the API directly sending data via the WebSocket, it will send it to the RabbitMQ server which will then send it to all the WebSockets to THEN send it to the client.
// ? When the API receives the data from the RabbitMQ server, we will need to calculate who to send it to (pretty much like we would do if the API was sending it directly to the WebSocket)
// ? Funny thing is (I just remembered) we don't got to calculate anything, just use topics :3

const channels = {
	// ? { type: ["sub"] } i.e { "channel": ["create", "delete", "update"] } will turn into "channel.create", "channel.delete", "channel.update"
	channel: ["create", "delete", "update"],
	user: ["update"],
	presence: ["update"],
	message: ["create", "delete", "update", "reported", "typing"],
	guild: ["create", "delete", "update"],
	invite: ["create", "delete", "update"],
	role: ["create", "delete", "update"],
	ban: ["create", "delete"],
	guildMember: ["add", "remove", "update", "ban", "unban", "kick", "chunk"],
	sessions: ["create", "delete"],
} as const;

// basically returns "channel.create" | "channel.delete" etc
type GetChannelTypes<T extends typeof channels> = {
	// @ts-expect-error -- I don't know how to fix this
	[K in keyof T]: `${K}.${T[K][number]}`;
}[keyof T];

interface opts {
	data: unknown;
	topic: string;
	type: string;
	workerId: number;
}

type func = (opt: opts) => void;
type events = "data";

class RabbitMQ {
	public rabbit!: amqplib.Connection;

	readonly #events: Map<string, Set<func>> = new Map();

	private channel!: amqplib.Channel;

	public constructor(private readonly config: MySchema) {
		this.config = config;
	}

	public on(event: events, data: func) {
		if (!this.#events.has(event)) this.#events.set(event, new Set());

		this.#events.get(event)?.add(data);
	}

	public emit(event: events, data: opts) {
		if (this.#events.get(event)) for (const func of this.#events.get(event)!) func(data);
	}

	public async init() {
		this.rabbit = await amqplib.connect(this.url);

		this.channel = await this.rabbit.createChannel();

		for (const [topic, types] of Object.entries(channels)) {
			for (const type of types) {
				await this.channel.assertExchange(`${topic}.${type}`, "fanout", { durable: false });

				const { queue } = await this.channel.assertQueue("", { exclusive: true });

				await this.channel.bindQueue(queue, `${topic}.${type}`, "");

				// eslint-disable-next-line @typescript-eslint/no-loop-func
				await this.channel.consume(queue, (msg) => {
					if (msg) {
						const parsed = this.decompress(msg.content);

						this.emit("data", parsed);

						this.channel.ack(msg);
					} else {
						postMessage({ type: "newLog", message: [`RabbitMQ Message was null for ${topic}.${type}`] });
					}
				});
			}
		}
	}

	public send(topic: GetChannelTypes<typeof channels>, data: unknown) {
		this.channel.publish(
			topic,
			"",
			Buffer.from(
				this.compress({
					data,
					topic,
					workerId: this.config.server.workerId,
				}),
			),
		);
	}

	private compress(data: unknown) {
		const string = this.jsonStringify(data);
		const stringToUint8Array = new TextEncoder().encode(string);

		// eslint-disable-next-line n/no-sync -- theres no other options
		return Bun.gzipSync(stringToUint8Array);
	}

	private decompress(data: Buffer) {
		// eslint-disable-next-line n/no-sync -- theres no other options
		const decompressed = Bun.gunzipSync(data);
		const uint8ArrayToString = new TextDecoder().decode(decompressed);

		return JSON.parse(uint8ArrayToString);
	}

	private get url() {
		return `amqp://${this.config.rabbitMQ.host}:${this.config.rabbitMQ.port}`;
	}

	/**
	 * basically can handle bigints turning them into strings
	 */
	public jsonStringify(data: unknown) {
		return JSON.stringify(data, (_, value) => {
			if (typeof value === "bigint") {
				return value.toString();
			}

			return value;
		});
	}
}

export default RabbitMQ;

export { type GetChannelTypes, channels };
