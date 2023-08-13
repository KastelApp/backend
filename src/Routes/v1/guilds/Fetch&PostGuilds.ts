/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

import { types } from '@kastelll/cassandra-driver';
import type { Request, Response } from 'express';
import User from '../../../Middleware/User.js';
import type App from '../../../Utils/Classes/App';
import Encryption from '../../../Utils/Classes/Encryption.js';
import ErrorGen from '../../../Utils/Classes/ErrorGen.js';
import Route from '../../../Utils/Classes/Route.js';
import type { Guild, User as UserRawType, Role as Roles, Channel as Channels } from '../../../Utils/Cql/Types/index.js';

interface NewGuildBody {
    Description: string;
    Features: string[];
    Flags: number;
    Name: string;
}

type Includeable = 'channels' | 'cowners' | 'owner' | 'roles';

interface UserType {
    Avatar: string | null;
    Flags: string;
    GlobalNickname: string | null;
    Id: string;
    Tag: string;
    Username: string;
}

interface ReturnedGuild {
    CoOwners: string[] | UserType[];
    Description: string | null;
    Features: string[];
    Flags: number;
    GuildId?: string;
    Icon: string | null;
    Id: string
    MaxMembers: number;
    Name: string;
    Owner: UserType
    OwnerId?: string;
}

// to do: add guilds to gateway events & fetch co-owners
export default class Main extends Route {

    public Includeable: Includeable[] = ['channels', 'cowners', 'owner', 'roles'];

    public constructor(App: App) {
        super(App);

        this.Methods = ['GET', 'POST'];

        this.Middleware = [
            User({
                AccessType: 'LoggedIn',
                AllowedRequesters: 'User',
                App,
                DisallowedFlags: ['GuildBan']
            })
        ];

        this.AllowedContentTypes = ['application/json'];

        this.Routes = ['/fetch', '/'];
    }

    public override async Request(Req: Request, Res: Response) {
        switch (Req.methodi) {
            case "GET": {
                await this.FetchGuilds(Req, Res);

                break;
            }

            case "POST": {
                if (Req.path.endsWith('/fetch')) {
                    Req.fourohfourit();

                    break;
                }

                await this.PostGuilds(Req, Res);

                break;
            }

            default: {
                Req.fourohfourit();

                break;
            }
        }
    }

    private async FetchGuilds(Req: Request<{ include?: string; }>, Res: Response): Promise<void> {
        const { include } = Req.query;
        const Guilds = await this.FetchUserGuilds(Req.user.Id);
        const Include = ((String(include)?.split(',') ?? []).filter((include) => this.Includeable.includes(include as any))) as Includeable[];

        const BuildGuilds = [];

        for (const GuildId of Guilds) {
            const Guild = await this.App.Cassandra.Models.Guild.get({
                GuildId: Encryption.encrypt(GuildId)
            });

            if (!Guild) continue;

            const FixedRoles = [];
            const FixedChannels = [];
            const FixedGuild: Partial<ReturnedGuild> = {
                Id: Guild.GuildId,
                ...Guild,
                Icon: Guild.Icon.length === 0 ? null : Guild.Icon,
                CoOwners: Guild.CoOwners ?? [],
                Features: Guild.Features ?? [],
                Description: Guild.Description.length === 0 ? null : Guild.Description,
            };
            
            delete FixedGuild.GuildId;

            if (Include.includes('channels')) {
                const Channels = await this.App.Cassandra.Models.Channel.find({
                    GuildId: Encryption.encrypt(GuildId)
                });

                for (const Channel of Channels.toArray()) {
                    FixedChannels.push({
                        Id: Channel.ChannelId,
                        Name: Channel.Name,
                        AllowedMenions: Channel.AllowedMentions,
                        Children: Channel.Children ?? [],
                        Description: Channel.Description.length === 0 ? null : Channel.Description,
                        Nsfw: Channel.Nsfw,
                        ParentId: Channel.ParentId.length === 0 ? null : Channel.ParentId,
                        PermissionsOverrides: Channel.PermissionsOverrides,
                        Position: Channel.Position,
                        Slowmode: Channel.Slowmode,
                        Type: Channel.Type
                    });
                }
            }

            if (Include.includes('roles')) {
                const Roles = await this.App.Cassandra.Models.Role.find({
                    GuildId: Encryption.encrypt(GuildId)
                });

                for (const Role of Roles.toArray()) {
                    FixedRoles.push({
                        Id: Role.RoleId,
                        Name: Role.Name,
                        AllowedMenions: Role.AllowedMentions,
                        AllowedNsfw: Role.AllowedNsfw,
                        Color: Role.Color,
                        Deleteable: Role.Deleteable,
                        Hoisted: Role.Hoisted,
                        Permissions: Role.Permissions.toString(),
                        Position: Role.Position
                    });
                }
            }
            
            if (Include.includes('owner')) {
                delete FixedGuild.OwnerId;
                
                const Owner = await this.FetchUser(Encryption.decrypt(Guild.OwnerId));
                
                if (Owner) {
                    FixedGuild.Owner = {
                        Avatar: Owner.Avatar.length === 0 ? null : Owner.Avatar,
                        Flags: Owner.Flags,
                        GlobalNickname: Owner.GlobalNickname.length === 0 ? null : Owner.GlobalNickname,
                        Id: Owner.UserId,
                        Tag: Owner.Tag,
                        Username: Owner.Username
                    };
                }
            }
            
            BuildGuilds.push({
                ...FixedGuild,
                Roles: FixedRoles,
                Channels: FixedChannels
            })
        }

        Res.send(Encryption.completeDecryption(BuildGuilds));
    }

    private async PostGuilds(Req: Request<any, any, NewGuildBody>, Res: Response): Promise<void> {
        const { Description, Name } = Req.body;


        if (!Name) {
            const MissingField = ErrorGen.MissingField();

            MissingField.AddError({
                Name: {
                    Code: 'MissingName',
                    Message: 'You must provide a name for your guild'
                }
            });

            Res.status(400).send(MissingField);

            return;
        }

        const Guilds = await this.FetchUserGuilds(Req.user.Id);

        console.log(Guilds);

        if (Guilds.length >= this.App.Constants.Settings.Max.GuildCount) {
            const LimitReached = ErrorGen.LimitReached();

            LimitReached.AddError({
                Guilds: {
                    Code: 'MaxGuildsReached',
                    Message: 'You have reached the maximum amount of guilds you can create.'
                }
            });

            Res.status(400).send(LimitReached);

            return;
        }

        const GuildId = this.App.Snowflake.Generate();

        const CategoryObject: Channels = {
            AllowedMentions: this.App.Constants.AllowedMentions.All as number,
            ChannelId: Encryption.encrypt(this.App.Snowflake.Generate()),
            Children: [],
            Description: '',
            GuildId: Encryption.encrypt(GuildId),
            Name: Encryption.encrypt('General Category'),
            Nsfw: false,
            ParentId: '',
            PermissionsOverrides: [],
            Type: this.App.Constants.ChannelTypes.GuildCategory,
            Position: 0,
            Slowmode: 0
        };
        const ChannelObject: Channels = {
            ChannelId: Encryption.encrypt(this.App.Snowflake.Generate()),
            Type: this.App.Constants.ChannelTypes.GuildText,
            AllowedMentions: this.App.Constants.AllowedMentions.All as number,
            Children: [],
            Description: '',
            GuildId: Encryption.encrypt(GuildId),
            Name: Encryption.encrypt('general'),
            Nsfw: false,
            ParentId: CategoryObject.ChannelId,
            PermissionsOverrides: [],
            Position: 0,
            Slowmode: 0
        };

        CategoryObject.Children.push(ChannelObject.ChannelId);

        const RoleObject: Roles = {
            Name: Encryption.encrypt('everyone'),
            AllowedMentions: this.App.Constants.AllowedMentions.All as number,
            AllowedNsfw: false,
            Color: 0,
            Deleteable: false,
            GuildId: Encryption.encrypt(GuildId),
            Hoisted: false,
            Permissions: types.Long.fromString('0'),
            Position: 0,
            RoleId: Encryption.encrypt(GuildId)
        };

        const GuildObject: Guild = {
            CoOwners: [],
            Description: Description ? Encryption.encrypt(Description) : '',
            Features: [],
            Flags: 0,
            GuildId: Encryption.encrypt(GuildId),
            Icon: '',
            MaxMembers: this.App.Constants.Settings.Max.MemberCount,
            Name: Name ? Encryption.encrypt(Name) : Encryption.encrypt('New Guild'),
            OwnerId: Encryption.encrypt(Req.user.Id),
        };

        await Promise.all([
            this.App.Cassandra.Models.Guild.insert(GuildObject),
            this.App.Cassandra.Models.Channel.insert(ChannelObject),
            this.App.Cassandra.Models.Channel.insert(CategoryObject),
            this.App.Cassandra.Models.Role.insert(RoleObject),
            this.App.Cassandra.Models.User.update({
                UserId: Encryption.encrypt(Req.user.Id),
                Guilds: [...Guilds, GuildId]
            })
        ]);

        const FormattedPaylaod = {
            Id: GuildObject.GuildId,
            Name: GuildObject.Name,
            CoOwners: [],
            OwnerId: GuildObject.OwnerId,
            Description: GuildObject.Description,
            Features: GuildObject.Features,
            Icon: GuildObject.Icon,
            MaxMembers: GuildObject.MaxMembers,
            Flags: GuildObject.Flags,
            Roles: [{
                Id: RoleObject.RoleId,
                ...RoleObject,
                RoleId: undefined,
                GuildId: undefined,
            }],
            Channels: [{
                Id: ChannelObject.ChannelId,
                ...ChannelObject,
                Description: null,
                ChannelId: undefined,
                GuildId: undefined,
            }, {
                Id: CategoryObject.ChannelId,
                ...CategoryObject,
                Description: null,
                ParentId: null,
                ChannelId: undefined,
                GuidlId: undefined
            }]
        };

        const UndefinesRemoved = {
            ...FormattedPaylaod,
            Roles: FormattedPaylaod.Roles.map((Role) => {
                const NewRole: Record<string, types.Long | boolean | number | string> = {};

                for (const [key, value] of Object.entries(Role)) {
                    if (value !== undefined) NewRole[key] = value;
                }

                return NewRole;
            }),
            Channels: FormattedPaylaod.Channels.map((Channel) => {
                const NewChannel: Record<string, string[] | boolean | number | string | null> = {};

                for (const [key, value] of Object.entries(Channel)) {
                    if (value !== undefined) NewChannel[key] = value;
                }

                return NewChannel;
            })
        };

        Res.status(201).send(Encryption.completeDecryption(UndefinesRemoved));
    }

    private async FetchUserGuilds(UserId: string) {
        const User = await this.App.Cassandra.Models.User.get({
            UserId: Encryption.encrypt(UserId)
        }, {
            fields: ['guilds']
        });

        if (!User) return [];

        return User.Guilds ?? [];
    }
    
    private async FetchUser(UserId?: string): Promise<UserRawType | null> {
		const FetchedUser = await this.App.Cassandra.Models.User.get({
			...(UserId ? { UserId: Encryption.encrypt(UserId) } : {}),
		}, {
            fields: ['avatar', 'flags', 'global_nickname', 'user_id', 'tag', 'username']
        });

		if (!FetchedUser) return null;

		return Encryption.completeDecryption({
			...FetchedUser,
			Flags: FetchedUser?.Flags ? String(FetchedUser.Flags) : '0',
		});
	}
}
