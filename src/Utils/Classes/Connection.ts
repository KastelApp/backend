import { EventEmitter } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import { URL } from 'node:url';
import cassandra, { mapping, type ClientOptions } from '@kastelll/cassandra-driver';
// ts-expect-error -- no types (some stupid reason they don't export this)
// import { TableMappings } from '@kastelll/cassandra-driver/lib/mapping/table-mappings.js';
import type { Ban, Bot, Channel, Dm, Emoji, File, Friend, Gift, Guild, GuildMember, Invite, Message, PermissionOverride, Role, Settings, User, VerificationLink, Webhook } from '../Cql/Types';

// class UnderscoreCqlToPascalCaseMappings extends TableMappings {
//     public ReservedWords: string[];

//     public constructor() {
//         super();

//         this.ReservedWords = [
//             'ADD', 'ALLOW', 'ALTER', 'AND', 'APPLY', 'ASC', 'AUTHORIZE', 'BATCH', 'BEGIN', 'BY', 'COLUMNFAMILY', 'CREATE', 'DELETE', 'DESC', 'DESCRIBE', 'DROP', 'ENTRIES', 'EXECUTE', 'FROM', 'FULL', 'GRANT', 'IF', 'IN', 'INDEX', 'INFINITY', 'INSERT', 'INTO', 'KEYSPACE', 'LIMIT', 'MODIFY', 'NAN', 'NORECURSIVE', 'NOT', 'NULL', 'OF', 'ON', 'OR', 'ORDER', 'PRIMARY', 'RENAME', 'REPLACE', 'REVOKE', 'SCHEMA', 'SELECT', 'SET', 'TABLE', 'TO', 'TOKEN', 'TRUNCATE', 'UNLOGGED', 'UPDATE', 'USE', 'USING', 'VIEW', 'WHERE', 'WITH'
//         ].map((word) => word.toLowerCase());

//     }

//     public getColumnName(PropName: string) {
//         const Propertyname = PropName.split(/(?=[A-Z])/).join('_').toLowerCase();

//         if (this.ReservedWords.includes(Propertyname)) {
//             return `${Propertyname}_`;
//         } else {
//             return Propertyname;
//         }
//     }

//     public getPropertyName(ColumnName: string) {
//         return ColumnName.split('_').map((word) => {
//             return word.charAt(0).toUpperCase() + word.slice(1);
//         }).join('');
//     }

//     public ObjectToDbRow(obj: any): Record<string, unknown>[] {
//         const Output: any[] = [];

//         for (const [_, value] of Object.entries(obj)) {
//             if (typeof value === "object") Output.push(this.ArrayOfObjectsToCqlObject(value));
//             else Output.push(value);
//         }

//         return Output;
//     }
    
//     public ObjecttoCorrectObject(obj: any): any {
//         if (!Array.isArray(obj)) {
//             const newObject: any = {};
    
//             for (const [key, value] of Object.entries(obj)) {
//                 if (value instanceof Date || value === null || value instanceof cassandra.types.Long) {
//                     newObject[this.getPropertyName(key)] = value;
//                 } else if (typeof value === 'object') {
//                     newObject[this.getPropertyName(key)] = this.ObjecttoCorrectObject(value);
//                 } else {
//                     newObject[this.getPropertyName(key)] = value;
//                 }
//             }
            
//             return newObject;
//         } else if (Array.isArray(obj)) {
//             return obj.map((value) => this.ObjecttoCorrectObject(value));
//         }
        
//         return obj;
//     }
    
//     public ArrayOfObjectsToCqlObject(obj: any): any {
//         if (!Array.isArray(obj)) {
//             const newObject: any = {};
    
//             for (const [key, value] of Object.entries(obj)) {
//                 if (value instanceof Date || value === null || value instanceof cassandra.types.Long) {
//                     newObject[this.getColumnName(key)] = value;
//                 } else if (typeof value === 'object') {
//                     newObject[this.getColumnName(key)] = this.ArrayOfObjectsToCqlObject(value);
//                 } else {
//                     newObject[this.getColumnName(key)] = value;
//                 }
//             }
            
//             return newObject;
//         } else if (Array.isArray(obj)) {
//             return obj.map((value) => this.ArrayOfObjectsToCqlObject(value));
//         }
        
//         return obj;
//     }


//     public newObjectInstance() {
//         return {};
//     }
// }

interface Connection {
    emit(event: 'Error', error: unknown): boolean;
    emit(event: 'Close' | 'Connected'): boolean;
    on(event: 'Error', listener: (error: unknown) => void): this;
    on(event: 'Close' | 'Connected', listener: () => void): this;
}

class Connection extends EventEmitter {
    private readonly TableDirectory: string = path.join(new URL('.', import.meta.url).pathname, '../Cql/Tables');

    public Client: cassandra.Client;

    public KeySpace: string;

    private Connected: boolean;

    private readonly MappingOptions: mapping.MappingOptions;

    public Mapper: mapping.Mapper;

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
        Role: cassandra.mapping.ModelMapper<Role>;
        Settings: cassandra.mapping.ModelMapper<Settings>;
        User: cassandra.mapping.ModelMapper<User>;
        VerificationLink: cassandra.mapping.ModelMapper<VerificationLink>;
        Webhook: cassandra.mapping.ModelMapper<Webhook>;
    };

    public UnderScoreCqlToPascalCaseMappings: mapping.UnderscoreCqlToPascalCaseMappings = new mapping.UnderscoreCqlToPascalCaseMappings(true);

    public constructor(
        nodes: string[],
        username: string,
        password: string,
        keyspace: string,
        options: Omit<ClientOptions, 'credentials' | 'keyspace'> = {},
    ) {
        super();

        this.Client = new cassandra.Client({
            contactPoints: nodes,
            localDataCenter: 'datacenter1',
            credentials: {
                username,
                password,
            },
            ...options,
        });

        this.KeySpace = keyspace;

        this.Connected = false;

        this.MappingOptions = {
            models: {
                'Ban': this.GenerateMappingOptions('bans'),
                'Bot': this.GenerateMappingOptions('bot'),
                'Channel': this.GenerateMappingOptions('channels'),
                'Dm': this.GenerateMappingOptions('dm'),
                'Emoji': this.GenerateMappingOptions('emojis'),
                'File': this.GenerateMappingOptions('files'),
                'Friend': this.GenerateMappingOptions('friends'),
                'Gift': this.GenerateMappingOptions('gifts'),
                'Guild': this.GenerateMappingOptions('guilds'),
                'GuildMember': this.GenerateMappingOptions('guild_members'),
                'Invite': this.GenerateMappingOptions('invites'),
                'Message': this.GenerateMappingOptions('messages'),
                'PermissionOverride': this.GenerateMappingOptions('permissionsoverides'),
                'Role': this.GenerateMappingOptions('roles'),
                'Settings': this.GenerateMappingOptions('settings'),
                'User': this.GenerateMappingOptions('users'),
                'VerificationLink': this.GenerateMappingOptions('verifcationlink'),
                'Webhook': this.GenerateMappingOptions('webhooks'),
            }
        } as const;

        this.Mapper = new mapping.Mapper(this.Client, this.MappingOptions);

        this.Models = {
            Ban: this.Mapper.forModel<Ban>('Ban'),
            Bot: this.Mapper.forModel<Bot>('Bot'),
            Channel: this.Mapper.forModel<Channel>('Channel'),
            Dm: this.Mapper.forModel<Dm>('Dm'),
            Emoji: this.Mapper.forModel<Emoji>('Emoji'),
            File: this.Mapper.forModel<File>('File'),
            Friend: this.Mapper.forModel<Friend>('Friend'),
            Gift: this.Mapper.forModel<Gift>('Gift'),
            Guild: this.Mapper.forModel<Guild>('Guild'),
            GuildMember: this.Mapper.forModel<GuildMember>('GuildMember'),
            Invite: this.Mapper.forModel<Invite>('Invite'),
            Message: this.Mapper.forModel<Message>('Message'),
            PermissionOverride: this.Mapper.forModel<PermissionOverride>('PermissionOverride'),
            Role: this.Mapper.forModel<Role>('Role'),
            Settings: this.Mapper.forModel<Settings>('Settings'),
            User: this.Mapper.forModel<User>('User'),
            VerificationLink: this.Mapper.forModel<VerificationLink>('VerificationLink'),
            Webhook: this.Mapper.forModel<Webhook>('Webhook'),
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

            await this.Execute(`CREATE KEYSPACE IF NOT EXISTS ${this.KeySpace} WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 1 };`);

            await this.Execute(`USE ${this.KeySpace};`);

            this.emit('Connected');
        } catch (error) {
            this.emit('Error', error);
        }
    }

    public async Shutdown() {
        try {
            await this.Client.shutdown();

            this.Connected = false;

            this.emit('Close');
        } catch (error) {
            this.emit('Error', error);
        }
    }

    public async Execute(query: string, params?: any[]) {
        if (!this.Connected) throw new Error('Not connected to cassandra');

        try {
            return await this.Client.execute(query, params, { prepare: true });
        } catch (error) {
            this.emit('Error', error);

            return null;
        }
    }

    public async ExecuteWithKeyspace(query: string, params?: any[]) {
        if (!this.Connected) throw new Error('Not connected to cassandra');

        try {
            return await this.Client.execute(query, params, { prepare: true, keyspace: this.KeySpace });
        } catch (error) {
            this.emit('Error', error);

            return null;
        }
    }

    private async WalkDirectory(dir: string): Promise<string[]> {
        const Paths = await fs.readdir(dir, { withFileTypes: true });
        const Files: string[] = [];

        for (const Path of Paths) {
            if (Path.isDirectory()) {
                const SubFiles = await this.WalkDirectory(path.join(dir, Path.name));
                Files.push(...SubFiles);
            } else {
                Files.push(path.join(dir, Path.name));
            }
        }

        return Files;
    }

    public async CreateTables() {
        const Files = await this.WalkDirectory(this.TableDirectory);

        for (const File of Files) {
            const Query = await fs.readFile(File, 'utf8');

            const SplitQuery = Query.split('\n');

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

            const NewSplitQuery: string[][] = [];

            let CurrentQuery: string[] = [];

            for (const Line of SplitQuery) {
                if (Line === '') {
                    NewSplitQuery.push(CurrentQuery);

                    CurrentQuery = [];
                } else {
                    CurrentQuery.push(Line);
                }
            }

            if (CurrentQuery.length > 0) {
                NewSplitQuery.push(CurrentQuery);
            }

            for (const Query of NewSplitQuery) {
                const Joined = Query.join('\n');

                if (Joined.length < 1) continue;

                try {
                    await this.Execute(Query.join('\n'));
                } catch {
                    this.emit('Error', `Failed to execute query ${Joined}`);
                }
            }
        }

        return true;
    }
}

export default Connection;

export {
    Connection
};
