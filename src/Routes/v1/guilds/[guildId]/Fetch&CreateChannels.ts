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
import { ChannelPermissions, ChannelTypes, MixedPermissions, PermissionOverrideTypes } from '../../../../Constants.js';
import User from '../../../../Middleware/User.js';
import type App from '../../../../Utils/Classes/App';
import GuildMemberFlags from '../../../../Utils/Classes/BitFields/GuildMember.js';
import FlagUtilsBInt, { FlagUtils } from '../../../../Utils/Classes/BitFields/NewFlags.js';
import Encryption from '../../../../Utils/Classes/Encryption.js';
import ErrorGen from '../../../../Utils/Classes/ErrorGen.js';
import Route from '../../../../Utils/Classes/Route.js';
import type {
    PermissionOverride,
} from '../../../../Utils/Cql/Types/index.js';
import { FixChannelPositions } from '../../../../Utils/Versioning/v1/FixChannelPositions.js';
import { GetEditedChannels } from '../../../../Utils/Versioning/v1/GetEditedChannels.js';


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
            Type: number;
        };
    },
    Position?: number;
    Slowmode?: number;
    Type?: number;
}

export default class Channels extends Route {
    private readonly Settings: { MaxChannelDescriptionLength: number; MaxChannelNameLength: number; MaxChannelSlowmode: number; };

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

        this.Settings = {
            MaxChannelNameLength: 124,
            MaxChannelDescriptionLength: 1_024,
            MaxChannelSlowmode: 86_400, // 24 hours
        };
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
            const PermissionOverrides = [];

            for (const PermissionOverrideId of (Channel.PermissionsOverrides ?? [])) {
                const Override = await this.App.Cassandra.Models.PermissionOverride.get({
                    PermissionId: PermissionOverrideId
                });

                if (!Override) continue;

                PermissionOverrides.push({
                    Allow: Override.Allow.toString(),
                    Deny: Override.Deny.toString(),
                    Slowmode: Override.Slowmode,
                    Type: Override.Type,
                    Id: Encryption.Decrypt(Override.Id)
                });
            }

            FixedChannels.push({
                Id: Channel.ChannelId,
                Name: Channel.Name,
                AllowedMenions: Channel.AllowedMentions,
                Children: Channel.Children ?? [],
                Description: Channel.Description.length === 0 ? null : Channel.Description,
                Nsfw: Channel.Nsfw,
                ParentId: Channel.ParentId.length === 0 ? null : Channel.ParentId,
                PermissionsOverrides: PermissionOverrides,
                Position: Channel.Position,
                Slowmode: Channel.Slowmode,
                Type: Channel.Type
            });
        }

        Res.send(Encryption.CompleteDecryption(FixedChannels));
    }

    public async PostChannels(Req: Request<{ guildId: string; }, any, CreateChannelBody>, Res: Response) {
        const { Name, Children, Description, Nsfw, ParentId, PermissionsOverrides, Position, Slowmode, Type } = Req.body;

        const Member = await this.FetchMember(Req.user.Id, Req.params.guildId);

        if (!Member) return; // will never happen

        const MemberFlags = new GuildMemberFlags(Member.Flags);
        const ChannelFlags = new FlagUtils<typeof ChannelTypes>(Type ?? 0, ChannelTypes);

        const FailedToCreateChannel = ErrorGen.FailedToCreateChannel();

        if (ChannelFlags.count === 0 || ChannelFlags.count > 1 || ChannelFlags.hasString('GuildCategory') && ParentId) {
            FailedToCreateChannel.AddError({
                Type: {
                    Code: 'InvalidType',
                    Message: 'The channel type is invalid.'
                }
            });
        }

        if (typeof Name !== "string" || Name?.length > this.Settings.MaxChannelNameLength || Name?.length < 1) {
            FailedToCreateChannel.AddError({
                Name: {
                    Code: 'InvalidName',
                    Message: 'The channel name is invalid.'
                }
            });
        }

        if (Description && ((Description?.length > this.Settings.MaxChannelDescriptionLength || Description?.length < 1) || typeof Description !== 'string')) {
            FailedToCreateChannel.AddError({
                Description: {
                    Code: 'InvalidDescription',
                    Message: 'The channel description is invalid.'
                }
            });
        }

        if (Position && typeof Position !== 'number') {
            FailedToCreateChannel.AddError({
                Position: {
                    Code: 'InvalidPosition',
                    Message: 'The channel position is invalid.'
                }
            });
        }

        if (Slowmode && ((Slowmode > this.Settings.MaxChannelSlowmode || Slowmode < 0) || typeof Slowmode !== 'number')) {
            FailedToCreateChannel.AddError({
                Slowmode: {
                    Code: 'InvalidSlowmode',
                    Message: 'The channel slowmode is invalid.'
                }
            });
        }

        if (Object.keys(FailedToCreateChannel.Errors).length > 0) {
            Res.status(400).json(FailedToCreateChannel.toJSON());

            return;
        }

        if (!MemberFlags.hasString('Owner') || !MemberFlags.hasString('CoOwner')) {
            // do other stuff (perm checks)
        }

        const CorrectPermissionOverrides: PermissionOverride[] = [];
        const PermissionErrors = [];

        for (const [key, value] of Object.entries(PermissionsOverrides ?? {})) {
            const PermissionOverrideFlags = new FlagUtils<typeof PermissionOverrideTypes>(value.Type, PermissionOverrideTypes);
            const Allow = new FlagUtilsBInt<typeof ChannelPermissions & typeof MixedPermissions>(value.Allow ?? 0n, { ...ChannelPermissions, ...MixedPermissions });
            const Deny = new FlagUtilsBInt<typeof ChannelPermissions & typeof MixedPermissions>(value.Deny ?? 0n, { ...ChannelPermissions, ...MixedPermissions });

            if (PermissionOverrideFlags.count === 0 || PermissionOverrideFlags.count > 1) {
                PermissionErrors.push({
                    index: Object.keys(PermissionsOverrides ?? {}).indexOf(key),
                    Error: {
                        Code: 'InvalidType',
                        Message: 'The permission override type is invalid.'
                    }
                });

                continue;
            }

            if (value.Slowmode && ((value.Slowmode > this.Settings.MaxChannelSlowmode || value.Slowmode < 0) || typeof value.Slowmode !== 'number')) {
                PermissionErrors.push({
                    index: Object.keys(PermissionsOverrides ?? {}).indexOf(key),
                    Error: {
                        Code: 'InvalidSlowmode',
                        Message: 'The permission override slowmode is invalid.'
                    }
                });

                continue;
            }

            // to do: permission checks

            CorrectPermissionOverrides.push({
                Allow: types.Long.fromString(String(Allow.cleaned)),
                Deny: types.Long.fromString(String(Deny.cleaned)),
                Editable: true,
                Id: Encryption.Encrypt(key),
                PermissionId: Encryption.Encrypt(this.App.Snowflake.Generate()),
                Slowmode: value.Slowmode ?? 0,
                Type: value.Type
            });
        }

        if (PermissionErrors.length > 0) {
            FailedToCreateChannel.AddError({
                PermissionsOverrides: PermissionErrors.reduce((prev: { [key: string]: { Code: string; Message: string; }; }, value) => {
                    prev[value.index] = value.Error;
                    return prev;
                }, {}),
            });
        }

        const Channels = await this.FetchGuildChannels(Req.params.guildId);

        if (Channels.length >= this.App.Constants.Settings.Max.ChannelCount) {
            FailedToCreateChannel.AddError({
                Guild: {
                    Code: 'MaxChannels',
                    Message: 'The guild has reached the max amount of channels.'
                }
            });
        }

        if (Object.keys(FailedToCreateChannel.Errors).length > 0) {
            Res.status(400).json(FailedToCreateChannel.toJSON());

            return;
        }

        const ChannelId = this.App.Snowflake.Generate();

        const BuiltChannel = {
            Name: Encryption.Encrypt(String(Name)),
            Children: Children ? Children.map((child) => Encryption.Encrypt(child)) : [],
            Description: Description ? Encryption.Encrypt(String(Description)) : '',
            Nsfw: Boolean(Nsfw),
            ParentId: ParentId ? Children ? '' : Encryption.Encrypt(ParentId) : '',
            PermissionsOverrides: CorrectPermissionOverrides,
            Position: Position ?? 0,
            Slowmode: Slowmode ?? 0,
            Type: ChannelFlags.cleaned,
            AllowedMentions: 0
        };

        const InsertChannel = {
            ...BuiltChannel,
            PermissionsOverrides: BuiltChannel.PermissionsOverrides.map((override) => override.PermissionId),
            GuildId: Encryption.Encrypt(Req.params.guildId),
            ChannelId: Encryption.Encrypt(ChannelId)
        };

        const FixedChannelPositions = FixChannelPositions(InsertChannel, Channels);

        const ChangedChannels = GetEditedChannels(Channels, FixedChannelPositions).filter((channel) => channel.ChannelId !== ChannelId);

        const Promises = [
            this.App.Cassandra.Models.Channel.insert(InsertChannel)
        ];

        for (const channel of ChangedChannels) {
            this.App.Logger.debug('Temporary debug log, The channel was updated, DO NOT FORGET TO ADD THIS TO THE WEBSOCKET MR', channel);

            Promises.push(this.App.Cassandra.Models.Channel.update(channel));
        }

        await Promise.all(Promises);

        Res.status(201).json({
            Id: ChannelId,
            ...Encryption.CompleteDecryption(BuiltChannel)
        });
    }

    private async VerifyGuild(UserId: string, GuildId: string) {
        const Guilds = await this.FetchGuilds(UserId);

        if (!Guilds.includes(Encryption.Encrypt(GuildId))) return false;

        const Member = await this.FetchMember(UserId, GuildId);

        if (!Member) return false;

        const MemberFlags = new GuildMemberFlags(Member.Flags);

        return MemberFlags.hasString('In');
    }

    private async FetchGuilds(UserId: string) {
        const User = await this.App.Cassandra.Models.User.get({
            UserId: Encryption.Encrypt(UserId),
        }, { fields: ['guilds'] });

        if (!User?.Guilds) return [];

        return User.Guilds;
    }

    private async FetchMember(UserId: string, GuildId: string) {
        const Member = await this.App.Cassandra.Models.GuildMember.get({
            UserId: Encryption.Encrypt(UserId),
            GuildId: Encryption.Encrypt(GuildId),
        }, {
            allowFiltering: true
        });

        if (!Member) return null;

        return Encryption.CompleteDecryption(Member);
    }

    private async FetchGuildChannels(GuildId: string) {
        const Channels = await this.App.Cassandra.Models.Channel.find({
            GuildId: Encryption.Encrypt(GuildId)
        });

        return Channels.toArray();
    }
}
