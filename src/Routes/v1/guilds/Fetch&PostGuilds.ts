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
import type { ExpressUser } from '../../../Types/index.js';
import type App from '../../../Utils/Classes/App';
import Encryption from '../../../Utils/Classes/Encryption.js';
import ErrorGen from '../../../Utils/Classes/ErrorGen.js';
import Route from '../../../Utils/Classes/Route.js';
import type { Guild, User as UserRawType, Role as Roles, Channel as Channels, GuildMember } from '../../../Utils/Cql/Types/index.js';

interface NewGuildBody {
    Description: string;
    Features: string[];
    Flags: number;
    Name: string;
}

type Includeable = 'cowners' | 'owner' | 'roles';

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
    Id: string;
    MaxMembers: number;
    Name: string;
    Owner: UserType;
    OwnerId?: string;
}

// to do: add guilds to gateway events & fetch co-owners
export default class Guilds extends Route {

    public Includeable: Includeable[] = ['cowners', 'owner', 'roles'];

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

    private async FetchGuilds(Req: Request<any, any, any, { after?: string; before?: string; include?: string; limit?: string; }>, Res: Response): Promise<void> {
        const { include, after, before, limit } = Req.query;
        const Include = ((String(include)?.split(',') ?? []).filter((include) => this.Includeable.includes(include as any))) as Includeable[];
        const ParsedLimit = Number.parseInt(limit ?? '100', 10);
        const Limit = Number.isNaN(ParsedLimit) ? 50 : ParsedLimit > 100 ? 50 : ParsedLimit < 1 ? 1 : ParsedLimit;

        const InvalidSnowflake = ErrorGen.InvalidSnowflake();

        if (after || before) {
            if (after && !this.App.Snowflake.Validate(after)) {
                InvalidSnowflake.AddError({
                    After: {
                        Code: 'InvalidSnowflake',
                        Message: 'The after snowflake is invalid'
                    }
                });
            }

            if (before && !this.App.Snowflake.Validate(before)) {
                InvalidSnowflake.AddError({
                    Before: {
                        Code: 'InvalidSnowflake',
                        Message: 'The before snowflake is invalid'
                    }
                });
            }

            if (before && after) {
                InvalidSnowflake.AddError({
                    Before: {
                        Code: 'InvalidSnowflake',
                        Message: 'You cannot use both before and after'
                    },
                    After: {
                        Code: 'InvalidSnowflake',
                        Message: 'You cannot use both before and after'
                    }
                });
            }

            if (Object.keys(InvalidSnowflake.Errors).length > 0) {
                Res.status(400).send(InvalidSnowflake.toJSON());

                return;
            }
        }

        const Guilds = await this.FetchUserGuilds(Req.user.Id);

        if (Guilds.length === 0) {
            Res.send([]);

            return;
        }

        if (after) {
            const AfterIndex = Guilds.indexOf(after);

            if (AfterIndex === -1) {
                InvalidSnowflake.AddError({
                    After: {
                        Code: 'InvalidSnowflake',
                        Message: 'There is no guild with that snowflake'
                    }
                });

                Res.status(400).send(InvalidSnowflake.toJSON());

                return;
            }

            Guilds.splice(0, AfterIndex + 1); // also removes the after snowflake guild
        }

        if (before) {
            const BeforeIndex = Guilds.indexOf(before);

            if (BeforeIndex === -1) {
                InvalidSnowflake.AddError({
                    Before: {
                        Code: 'InvalidSnowflake',
                        Message: 'There is no guild with that snowflake'
                    }
                });

                Res.status(400).send(InvalidSnowflake.toJSON());

                return;
            }

            Guilds.splice(BeforeIndex);
        }

        Guilds.splice(Limit);

        const BuildGuilds = [];

        for (const GuildId of Guilds) {
            const Guild = await this.App.Cassandra.Models.Guild.get({
                GuildId: Encryption.Encrypt(GuildId)
            });

            if (!Guild) continue;

            const FixedRoles = [];
            const FixedGuild: Partial<ReturnedGuild> = {
                Id: Guild.GuildId,
                ...Guild,
                Icon: Guild.Icon.length === 0 ? null : Guild.Icon,
                CoOwners: Guild.CoOwners ?? [],
                Features: Guild.Features ?? [],
                Description: Guild.Description.length === 0 ? null : Guild.Description,
            };

            delete FixedGuild.GuildId;

            if (Include.includes('roles')) {
                const Roles = await this.App.Cassandra.Models.Role.find({
                    GuildId: Encryption.Encrypt(GuildId)
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

                const Owner = await this.FetchUser(Encryption.Decrypt(Guild.OwnerId));

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
                Roles: FixedRoles
            });
        }

        Res.send(Encryption.CompleteDecryption(BuildGuilds));
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

        this.App.Logger.debug(`Someones creating a new guild, they own ${Guilds.length}`);

        if (this.CheckGuildCount(Req.user, Guilds.length)) {
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
            ChannelId: Encryption.Encrypt(this.App.Snowflake.Generate()),
            Children: [],
            Description: '',
            GuildId: Encryption.Encrypt(GuildId),
            Name: Encryption.Encrypt('General Category'),
            Nsfw: false,
            ParentId: '',
            PermissionsOverrides: [],
            Type: this.App.Constants.ChannelTypes.GuildCategory,
            Position: 0,
            Slowmode: 0
        };
        const ChannelObject: Channels = {
            ChannelId: Encryption.Encrypt(this.App.Snowflake.Generate()),
            Type: this.App.Constants.ChannelTypes.GuildText,
            AllowedMentions: this.App.Constants.AllowedMentions.All as number,
            Children: [],
            Description: '',
            GuildId: Encryption.Encrypt(GuildId),
            Name: Encryption.Encrypt('general'),
            Nsfw: false,
            ParentId: CategoryObject.ChannelId,
            PermissionsOverrides: [],
            Position: 0,
            Slowmode: 0
        };

        CategoryObject.Children.push(ChannelObject.ChannelId);

        const RoleObject: Roles = {
            Name: Encryption.Encrypt('everyone'),
            AllowedMentions: this.App.Constants.AllowedMentions.All as number,
            AllowedNsfw: false,
            Color: 0,
            Deleteable: false,
            GuildId: Encryption.Encrypt(GuildId),
            Hoisted: false,
            Permissions: types.Long.fromString('0'),
            Position: 0,
            RoleId: Encryption.Encrypt(GuildId)
        };

        const GuildObject: Guild = {
            CoOwners: [],
            Description: Description ? Encryption.Encrypt(Description) : '',
            Features: [],
            Flags: 0,
            GuildId: Encryption.Encrypt(GuildId),
            Icon: '',
            MaxMembers: this.App.Constants.Settings.Max.MemberCount,
            Name: Name ? Encryption.Encrypt(Name) : Encryption.Encrypt('New Guild'),
            OwnerId: Encryption.Encrypt(Req.user.Id),
        };

        const GuildMember: GuildMember = {
            Flags: this.App.Constants.GuildMemberFlags.Owner | this.App.Constants.GuildMemberFlags.In,
            GuildId: Encryption.Encrypt(GuildId),
            JoinedAt: new Date(),
            Nickname: '',
            Roles: [RoleObject.RoleId],
            Timeouts: [],
            UserId: Encryption.Encrypt(Req.user.Id)
        };

        await Promise.all([
            this.App.Cassandra.Models.Guild.insert(GuildObject),
            this.App.Cassandra.Models.Channel.insert(ChannelObject),
            this.App.Cassandra.Models.Channel.insert(CategoryObject),
            this.App.Cassandra.Models.Role.insert(RoleObject),
            this.App.Cassandra.Models.GuildMember.insert(GuildMember),
            this.App.Cassandra.Models.User.update({
                UserId: Encryption.Encrypt(Req.user.Id),
                Guilds: [...Encryption.CompleteEncryption(Guilds), Encryption.Encrypt(GuildId)]
            })
        ]);

        const FormattedPaylaod = {
            Id: GuildObject.GuildId,
            Name: GuildObject.Name,
            CoOwners: [],
            OwnerId: GuildObject.OwnerId,
            Description: GuildObject.Description.length === 0 ? null : GuildObject.Description,
            Features: GuildObject.Features,
            Icon: GuildObject.Icon.length === 0 ? null : GuildObject.Icon,
            MaxMembers: GuildObject.MaxMembers,
            Flags: GuildObject.Flags,
            Roles: [{
                Id: RoleObject.RoleId,
                ...RoleObject,
                Permissions: RoleObject.Permissions.toString(),
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

        Res.status(201).send(Encryption.CompleteDecryption(UndefinesRemoved));
    }

    private async FetchUserGuilds(UserId: string): Promise<string[]> {
        const User = await this.App.Cassandra.Models.User.get({
            UserId: Encryption.Encrypt(UserId)
        }, {
            fields: ['guilds']
        });

        if (!User || !Array.isArray(User.Guilds)) return [];

        return Encryption.CompleteDecryption(User.Guilds);
    }

    private async FetchUser(UserId?: string): Promise<UserRawType | null> {
        const FetchedUser = await this.App.Cassandra.Models.User.get({
            ...(UserId ? { UserId: Encryption.Encrypt(UserId) } : {}),
        }, {
            fields: ['avatar', 'flags', 'global_nickname', 'user_id', 'tag', 'username']
        });

        if (!FetchedUser) return null;

        return Encryption.CompleteDecryption({
            ...FetchedUser,
            Flags: FetchedUser?.Flags ? String(FetchedUser.Flags) : '0',
        });
    }

    private CheckGuildCount(User: ExpressUser, Count: number): boolean {
        if (User.FlagsUtil.hasString('IncreasedGuildCount500')) return Count >= 500;
        if (User.FlagsUtil.hasString('IncreasedGuildCount200')) return Count >= 200;
        if (User.FlagsUtil.hasString('IncreasedGuildCount100')) return Count >= 100;

        return Count >= this.App.Constants.Settings.Max.GuildCount;
    }
}
