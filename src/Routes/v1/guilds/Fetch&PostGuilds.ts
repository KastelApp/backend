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

import type { Request, Response } from 'express';
import User from '../../../Middleware/User.js';
import type App from '../../../Utils/Classes/App';
import Encryption from '../../../Utils/Classes/Encryption.js';
import ErrorGen from '../../../Utils/Classes/ErrorGen.js';
import Route from '../../../Utils/Classes/Route.js';
import type Channels from '../../../Utils/Cql/Types/Channel.js';
import type Roles from '../../../Utils/Cql/Types/Role.js';
import type { Guild } from '../../../Utils/Cql/Types/index.js';

interface NewGuildBody {
    Description: string;
    Features: string[];
    Flags: number;
    Name: string;
}

export default class Main extends Route {
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
                await this.PostGuilds(Req, Res);
                
                break;
            }
            
            default: {
                Req.fourohfourit();
                
                break;
            }
        }
    }
    
    private async FetchGuilds(Req: Request<{ include: string }>, Res: Response): Promise<void> {
        const Guilds = await this.FetchUserGuilds(Req.user.Id);
        
        Res.send(Guilds);
    }
    
    private async PostGuilds(Req: Request<any, any, NewGuildBody>, Res: Response): Promise<void> {
        const { Description, Features, Flags, Name } = Req.body;
        
        
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
        }
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
        }
        
        CategoryObject.Children.push(ChannelObject.ChannelId);
        
        const RoleObject: Roles = {
            Name: Encryption.encrypt('everyone'),
            AllowedMentions: this.App.Constants.AllowedMentions.All as number,
            AllowedNsfw: false,
            Color: 0,
            Deleteable: false,
            GuildId: Encryption.encrypt(GuildId),
            Hoisted: false,
            Permissions: '0',
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
                const NewRole: Record<string, boolean | number | string>= {};
                
                for (const [key, value] of Object.entries(Role)) {
                    if (value !== undefined) NewRole[key] = value;
                }
                
                return NewRole;
            }),
            Channels: FormattedPaylaod.Channels.map((Channel) => {
                const NewChannel: Record<string, string[] | boolean | number | string | null>= {};
                
                for (const [key, value] of Object.entries(Channel)) {
                    if (value !== undefined) NewChannel[key] = value;
                }
                
                return NewChannel;
            })
        }
        
        Res.status(201).send(Encryption.completeDecryption(UndefinesRemoved))
    }
    
    private async FetchUserGuilds(UserId: string) {
        const User = await this.App.Cassandra.Models.User.get({
            UserId: Encryption.encrypt(UserId)
        }, {
            fields: ['guilds']
        })
        
        if (!User) return [];
        
        return User.Guilds ?? [];
    }
}
