import { EventEmitter } from "node:events";
import fs from "node:fs/promises";
import path from "node:path";
import { URL } from "node:url";
import cassandra, { mapping, type ClientOptions } from "@kastelll/cassandra-driver";
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
	private readonly TableDirectory: string = path.join(new URL(".", import.meta.url).pathname, "../Cql/Tables");

	public Client: cassandra.Client;

	public KeySpace: string;

	private Connected: boolean;

	private readonly MappingOptions: mapping.MappingOptions;

	public Mapper: mapping.Mapper;

	private readonly NetworkTopologyStrategy: {
		[DataCenter: string]: number;
	};

	public Models: {
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
		PlatformInvite: cassandra.mapping.ModelMapper<PlatformInvite>,
		Role: cassandra.mapping.ModelMapper<Role>;
		Settings: cassandra.mapping.ModelMapper<Settings>;
		User: cassandra.mapping.ModelMapper<User>;
		VerificationLink: cassandra.mapping.ModelMapper<VerificationLink>;
		Webhook: cassandra.mapping.ModelMapper<Webhook>;
	};

	public UnderScoreCqlToPascalCaseMappings: mapping.UnderscoreCqlToCamelCaseMappings =
		new mapping.UnderscoreCqlToCamelCaseMappings(true);

	public DurableWrites: boolean;

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

		this.Client = new cassandra.Client({
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

		this.KeySpace = keyspace;

		this.Connected = false;

		this.NetworkTopologyStrategy = networkTopologyStrategy;

		this.DurableWrites = durableWrites;

		this.MappingOptions = {
			models: {
				Ban: this.GenerateMappingOptions("bans"),
				Bot: this.GenerateMappingOptions("bot"),
				Channel: this.GenerateMappingOptions("channels"),
				Dm: this.GenerateMappingOptions("dm"),
				Emoji: this.GenerateMappingOptions("emojis"),
				File: this.GenerateMappingOptions("files"),
				Friend: this.GenerateMappingOptions("friends"),
				Gift: this.GenerateMappingOptions("gifts"),
				Guild: this.GenerateMappingOptions("guilds"),
				GuildMember: this.GenerateMappingOptions("guild_members"),
				Invite: this.GenerateMappingOptions("invites"),
				Message: this.GenerateMappingOptions("messages"),
				PermissionOverride: this.GenerateMappingOptions("permissionsoverides"),
				Role: this.GenerateMappingOptions("roles"),
				Settings: this.GenerateMappingOptions("settings"),
				User: this.GenerateMappingOptions("users"),
				VerificationLink: this.GenerateMappingOptions("verifcationlink"),
				Webhook: this.GenerateMappingOptions("webhooks"),
				PaltformInvite: this.GenerateMappingOptions("platform_invite"),
			},
		} as const;

		this.Mapper = new mapping.Mapper(this.Client, this.MappingOptions);

		this.Models = {
			Ban: this.Mapper.forModel<Ban>("Ban"),
			Bot: this.Mapper.forModel<Bot>("Bot"),
			Channel: this.Mapper.forModel<Channel>("Channel"),
			Dm: this.Mapper.forModel<Dm>("Dm"),
			Emoji: this.Mapper.forModel<Emoji>("Emoji"),
			File: this.Mapper.forModel<File>("File"),
			Friend: this.Mapper.forModel<Friend>("Friend"),
			Gift: this.Mapper.forModel<Gift>("Gift"),
			Guild: this.Mapper.forModel<Guild>("Guild"),
			GuildMember: this.Mapper.forModel<GuildMember>("GuildMember"),
			Invite: this.Mapper.forModel<Invite>("Invite"),
			Message: this.Mapper.forModel<Message>("Message"),
			PermissionOverride: this.Mapper.forModel<PermissionOverride>("PermissionOverride"),
			Role: this.Mapper.forModel<Role>("Role"),
			Settings: this.Mapper.forModel<Settings>("Settings"),
			User: this.Mapper.forModel<User>("User"),
			VerificationLink: this.Mapper.forModel<VerificationLink>("VerificationLink"),
			Webhook: this.Mapper.forModel<Webhook>("Webhook"),
			PlatformInvite: this.Mapper.forModel<PlatformInvite>("PlatformInvite"),
		};
	}

	private GenerateMappingOptions(TableName: string): cassandra.mapping.ModelOptions {
		return {
			tables: [TableName],
			mappings: this.UnderScoreCqlToPascalCaseMappings,
			keyspace: this.KeySpace,
		};
	}

	public async Connect() {
		try {
			await this.Client.connect();

			this.Connected = true;

			let createKeySpace = `CREATE KEYSPACE IF NOT EXISTS ${this.KeySpace}`;

			if (this.NetworkTopologyStrategy && Object.keys(this.NetworkTopologyStrategy).length > 0) {
				createKeySpace += ` WITH REPLICATION = { 'class' : 'NetworkTopologyStrategy' ${Object.entries(
					this.NetworkTopologyStrategy,
				)
					.map(([DataCenter, ReplicationFactor]) => `, '${DataCenter}' : ${ReplicationFactor}`)
					.join(", ")} }`;
			} else {
				createKeySpace += " WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 1 }";
			}

			createKeySpace += ` AND DURABLE_WRITES = ${this.DurableWrites};`;

			await this.Execute(createKeySpace).catch((error) => {
				this.emit("Error", error);
			});

			await this.Execute(`USE ${this.KeySpace};`);

			// await this.Execute("TRACING ON;")

			this.emit("Connected");
		} catch (error) {
			this.emit("Error", error);
		}
	}

	public async Shutdown() {
		try {
			await this.Client.shutdown();

			this.Connected = false;

			this.emit("Close");
		} catch (error) {
			this.emit("Error", error);
		}
	}

	public async Execute(query: string, params?: any[]) {
		if (!this.Connected) throw new Error("Not connected to cassandra");

		try {
			return await this.Client.execute(query, params, { prepare: true });
		} catch (error) {
			this.emit("Error", error);

			return null;
		}
	}

	public async ExecuteWithKeyspace(query: string, params?: any[]) {
		if (!this.Connected) throw new Error("Not connected to cassandra");

		try {
			return await this.Client.execute(query, params, { prepare: true, keyspace: this.KeySpace });
		} catch (error) {
			this.emit("Error", error);

			return null;
		}
	}

	private async WalkDirectory(dir: string): Promise<string[]> {
		const paths = await fs.readdir(dir, { withFileTypes: true });
		const files: string[] = [];

		for (const filePath of paths) {
			if (filePath.isDirectory()) {
				const subFiles = await this.WalkDirectory(path.join(dir, filePath.name));
				files.push(...subFiles);
			} else {
				files.push(path.join(dir, filePath.name));
			}
		}

		return files;
	}

	public async CreateTables() {
		const files = await this.WalkDirectory(this.TableDirectory);

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
					await this.Execute(query.join("\n"));
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
