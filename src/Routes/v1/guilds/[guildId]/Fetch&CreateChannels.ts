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
import User from '../../../../Middleware/User.js';
import type App from '../../../../Utils/Classes/App';
import Encryption from '../../../../Utils/Classes/Encryption.js';
import ErrorGen from '../../../../Utils/Classes/ErrorGen.js';
import Route from '../../../../Utils/Classes/Route.js';

interface CreateChannelBody {
    Children?: string[];
    Description?: string;
    Name: string;
    Nsfw?: boolean;
    ParentId?: string;
    PermissionsOverrides?: {
        [key: string]: {
            Allow: string;
            Deny: string;
            Slowmode: number;
        };
    },
    Position?: number;
    Slowmode?: number;
    Type?: number;
}

export default class Channels extends Route {
    public constructor(App: App) {
        super(App);

        this.Methods = ['GET', 'POST'];

        this.Middleware = [
            User({
                AccessType: 'LoggedIn',
                AllowedRequesters: 'User',
                App,
            })
        ];

        this.AllowedContentTypes = ['application/json'];

        this.Routes = ['/channels'];
    }

    public override async Request(Req: Request<{ guildId: string; }>, Res: Response) {

        const ValidatedGuild = await this.VerifyGuild(Req.user.Id, Req.params.guildId);

        if (!ValidatedGuild) {
            const Error = ErrorGen.UnknownGuild();

            Error.AddError({
                GuildId: {
                    Code: 'UnknownGuild',
                    Message: 'The guild is Invalid, Does not exist or you are not in it.'
                }
            });

            Res.status(404).json(Error.toJSON());

            return;
        }

        switch (Req.methodi) {
            case "GET": {
                await this.FetchChannels(Req, Res);

                break;
            }

            case "POST": {
                if (Req.path.endsWith('/fetch')) {
                    Req.fourohfourit();

                    break;
                }

                await this.PostChannels(Req, Res);

                break;
            }

            default: {
                Req.fourohfourit();

                break;
            }
        }
    }

    public async FetchChannels(Req: Request<{ guildId: string; }>, Res: Response) {
        const FixedChannels = [];

        const Channels = await this.App.Cassandra.Models.Channel.find({
            GuildId: Encryption.Encrypt(Req.params.guildId)
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

        Res.send(Encryption.CompleteDecryption(FixedChannels));
    }

    public async PostChannels(Req: Request<{ guildId: string; }, any, CreateChannelBody>, Res: Response) {
        const { Name, Children, Description, Nsfw, ParentId, PermissionsOverrides, Position, Slowmode, Type } = Req.body;
    }

    public async VerifyGuild(UserId: string, GuidlId: string) {
        const User = await this.App.Cassandra.Models.User.get({
            UserId: Encryption.Encrypt(UserId),
        }, { fields: ['guilds'] });

        if (!User?.Guilds) return false;

        return User.Guilds.includes(Encryption.Encrypt(GuidlId));
    }
}
