import { EventEmitter } from "node:events";
import fs from "node:fs/promises";
import path from "node:path";
import cassandra, { mapping, type ClientOptions } from "@kastelapp/cassandra-driver";
import type {
	Ban,
	Bot,
	Channel,
	Dm,
	Emoji,
	File,
	Friend,
	Gift,
	Guild,
	GuildMember,
	Invite,
	Message,
	PermissionOverride,
	Role,
	Settings,
	User,
	VerificationLink,
	Webhook,
} from "../Cql/Types";
import type PlatformInvite from "../Cql/Types/PlatformInvite.ts";

interface Connection {
	emit(event: "Error", error: unknown): boolean;
	emit(event: "Close" | "Connected"): boolean;
	on(event: "Error", listener: (error: unknown) => void): this;
	on(event: "Close" | "Connected", listener: () => void): this;
}

class Connection extends EventEmitter {
	private readonly TableDirectory: string = path.join(import.meta.dirname, "../Cql/Tables");

	public client: cassandra.Client;

	public keySpace: string;

	private connected: boolean;

	private readonly mappingOptions: mapping.MappingOptions;

	public mapper: mapping.Mapper;

	private readonly networkTopologyStrategy: {
		[DataCenter: string]: number;
	};

	public models: {
		Ban: cassandra.mapping.ModelMapper<Ban>;
		Bot: cassandra.mapping.ModelMapper<Bot>;
		Channel: cassandra.mapping.ModelMapper<Channel>;
		Dm: cassandra.mapping.ModelMapper<Dm>;
		Emoji: cassandra.mapping.ModelMapper<Emoji>;
		File: cassandra.mapping.ModelMapper<File>;
		Friend: cassandra.mapping.ModelMapper<Friend>;
		Gift: cassandra.mapping.ModelMapper<Gift>;
		Guild: cassandra.mapping.ModelMapper<Guild>;
		GuildMember: cassandra.mapping.ModelMapper<GuildMember>;
		Invite: cassandra.mapping.ModelMapper<Invite>;
		Message: cassandra.mapping.ModelMapper<Message>;
		PermissionOverride: cassandra.mapping.ModelMapper<PermissionOverride>;
		PlatformInvite: cassandra.mapping.ModelMapper<PlatformInvite>;
		Role: cassandra.mapping.ModelMapper<Role>;
		Settings: cassandra.mapping.ModelMapper<Settings>;
		User: cassandra.mapping.ModelMapper<User>;
		VerificationLink: cassandra.mapping.ModelMapper<VerificationLink>;
		Webhook: cassandra.mapping.ModelMapper<Webhook>;
	};

	public underscoreCqlToCamelCaseMappings: mapping.UnderscoreCqlToCamelCaseMappings =
		new mapping.UnderscoreCqlToCamelCaseMappings(true);

	public durableWrites: boolean;

	public constructor(
		nodes: string[],
		username: string,
		password: string,
		keyspace: string,
		networkTopologyStrategy: {
			[DataCenter: string]: number;
		},
		durableWrites: boolean,
		options: Omit<ClientOptions, "credentials" | "keyspace"> = {},
	) {
		super();

		this.client = new cassandra.Client({
			contactPoints: nodes,
			localDataCenter: networkTopologyStrategy
				? Object.keys(networkTopologyStrategy)?.[0] ?? "datacenter1"
				: "datacenter1",
			credentials: {
				username,
				password,
			},
			...options,
		});

		this.keySpace = keyspace;

		this.connected = false;

		this.networkTopologyStrategy = networkTopologyStrategy;

		this.durableWrites = durableWrites;

		this.mappingOptions = {
			models: {
				Ban: this.generateMappingOptions("bans"),
				Bot: this.generateMappingOptions("bots"),
				Channel: this.generateMappingOptions("channels"),
				Dm: this.generateMappingOptions("dms"),
				Emoji: this.generateMappingOptions("emojis"),
				File: this.generateMappingOptions("files"),
				Friend: this.generateMappingOptions("friends"),
				Gift: this.generateMappingOptions("gifts"),
				Guild: this.generateMappingOptions("guilds"),
				GuildMember: this.generateMappingOptions("guild_members"),
				Invite: this.generateMappingOptions("invites"),
				Message: this.generateMappingOptions("messages"),
				PermissionOverride: this.generateMappingOptions("permissions_overides"),
				Role: this.generateMappingOptions("roles"),
				Settings: this.generateMappingOptions("settings"),
				User: this.generateMappingOptions("users"),
				VerificationLink: this.generateMappingOptions("verifcationlinks"),
				Webhook: this.generateMappingOptions("webhooks"),
				PlatformInvite: this.generateMappingOptions("platform_invite"),
			},
		} as const;

		this.mapper = new mapping.Mapper(this.client, this.mappingOptions);

		this.models = {
			Ban: this.mapper.forModel<Ban>("Ban"),
			Bot: this.mapper.forModel<Bot>("Bot"),
			Channel: this.mapper.forModel<Channel>("Channel"),
			Dm: this.mapper.forModel<Dm>("Dm"),
			Emoji: this.mapper.forModel<Emoji>("Emoji"),
			File: this.mapper.forModel<File>("File"),
			Friend: this.mapper.forModel<Friend>("Friend"),
			Gift: this.mapper.forModel<Gift>("Gift"),
			Guild: this.mapper.forModel<Guild>("Guild"),
			GuildMember: this.mapper.forModel<GuildMember>("GuildMember"),
			Invite: this.mapper.forModel<Invite>("Invite"),
			Message: this.mapper.forModel<Message>("Message"),
			PermissionOverride: this.mapper.forModel<PermissionOverride>("PermissionOverride"),
			Role: this.mapper.forModel<Role>("Role"),
			Settings: this.mapper.forModel<Settings>("Settings"),
			User: this.mapper.forModel<User>("User"),
			VerificationLink: this.mapper.forModel<VerificationLink>("VerificationLink"),
			Webhook: this.mapper.forModel<Webhook>("Webhook"),
			PlatformInvite: this.mapper.forModel<PlatformInvite>("PlatformInvite"),
		};
	}

	private generateMappingOptions(TableName: string): cassandra.mapping.ModelOptions {
		return {
			tables: [TableName],
			mappings: this.underscoreCqlToCamelCaseMappings,
			keyspace: this.keySpace,
		};
	}

	public async connect() {
		try {
			await this.client.connect();

			this.connected = true;

			let createKeySpace = `CREATE KEYSPACE IF NOT EXISTS ${this.keySpace}`;

			if (this.networkTopologyStrategy && Object.keys(this.networkTopologyStrategy).length > 0) {
				createKeySpace += ` WITH REPLICATION = { 'class' : 'NetworkTopologyStrategy' ${Object.entries(
					this.networkTopologyStrategy,
				)
					.map(([DataCenter, ReplicationFactor]) => `, '${DataCenter}' : ${ReplicationFactor}`)
					.join(", ")} }`;
			} else {
				createKeySpace += " WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 1 }";
			}

			createKeySpace += ` AND DURABLE_WRITES = ${this.durableWrites};`;

			await this.execute(createKeySpace).catch((error) => {
				this.emit("Error", error);
			});

			await this.execute(`USE ${this.keySpace};`);

			this.emit("Connected");
		} catch (error) {
			this.emit("Error", error);
		}
	}

	public async shutdown() {
		try {
			await this.client.shutdown();

			this.connected = false;

			this.emit("Close");
		} catch (error) {
			this.emit("Error", error);
		}
	}

	public async execute(query: string, params?: any[]) {
		if (!this.connected) throw new Error("Not connected to cassandra");

		try {
			return await this.client.execute(query, params, { prepare: true });
		} catch (error) {
			this.emit("Error", error);

			return null;
		}
	}

	public async executeWithKeyspace(query: string, params?: any[]) {
		if (!this.connected) throw new Error("Not connected to cassandra");

		try {
			return await this.client.execute(query, params, { prepare: true, keyspace: this.keySpace });
		} catch (error) {
			this.emit("Error", error);

			return null;
		}
	}

	private async walkDirectory(dir: string): Promise<string[]> {
		const paths = await fs.readdir(dir, { withFileTypes: true });
		const files: string[] = [];

		for (const filePath of paths) {
			if (filePath.isDirectory()) {
				const subFiles = await this.walkDirectory(path.join(dir, filePath.name));
				files.push(...subFiles);
			} else {
				files.push(path.join(dir, filePath.name));
			}
		}

		return files;
	}

	public async createTables() {
		const files = await this.walkDirectory(this.TableDirectory);

		for (const file of files) {
			const query = await fs.readFile(file, "utf8");

			const splitQuery = query.split("\n");

			// When theres a '' in the array it means theres a newline that used to be there so for example
			/*
				[
					'CREATE TABLE IF NOT EXISTS verifcationlink (',
					'\tcode text PRIMARY KEY,',
					'\tuser_id bigint,',
					'\tcreated_date int,',
					'\texpire_date int,',
					'\tip text,',
					'\tflags int,',
					');',
					'',
					'CREATE INDEX IF NOT EXISTS verifcationlink_code_index ON verifcationlink (code, ip, flags);',
					''
				]
			*/
			// that means we need to make a new array with the CREATE TABLE... and then the CREATE INDEX... and then execute those one by one
			// There definetly is a better way to do this but I'm too lazy to figure it out

			const newSplitQuery: string[][] = [];

			let currentQuery: string[] = [];

			for (const line of splitQuery) {
				if (line === "") {
					newSplitQuery.push(currentQuery);

					currentQuery = [];
				} else {
					currentQuery.push(line);
				}
			}

			if (currentQuery.length > 0) {
				newSplitQuery.push(currentQuery);
			}

			for (const query of newSplitQuery) {
				const joined = query.join("\n");

				if (joined.length < 1) continue;

				try {
					await this.execute(query.join("\n"));
				} catch {
					this.emit("Error", `Failed to execute query ${joined}`);
				}
			}
		}

		return true;
	}
}

export default Connection;

export { Connection };
