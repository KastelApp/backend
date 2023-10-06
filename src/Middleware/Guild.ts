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

import type { NextFunction, Request, Response } from 'express';
import type { GuildMiddleware } from '../Types/Routes';
import GuildMemberFlags from '../Utils/Classes/BitFields/GuildMember.ts';
import Encryption from '../Utils/Classes/Encryption.ts';
import ErrorGen from '../Utils/Classes/ErrorGen.ts';

const Guild = (options: GuildMiddleware) => {
	return async (Req: Request<{ guildId?: string }>, Res: Response, next: NextFunction) => {
		const Error = ErrorGen.UnknownGuild();

		if ((options.Required && !Req.params.guildId) || !Req.user?.Id) {
			options.App.Logger.debug('Guild is required but not provided');

			Error.AddError({
				GuildId: {
					Code: 'UnknownGuild',
					Message: 'The guild is Invalid, Does not exist or you are not in it.',
				},
			});

			Res.status(404).json(Error.toJSON());

			return;
		}

		const UserGuilds = await options.App.Cassandra.Models.User.get(
			{
				UserId: Encryption.Encrypt(Req.user.Id),
			},
			{
				fields: ['guilds'],
			},
		);

		if (!UserGuilds?.Guilds) {
			options.App.Logger.debug('User has no guilds');

			Error.AddError({
				GuildId: {
					Code: 'UnknownGuild',
					Message: 'The guild is Invalid, Does not exist or you are not in it.',
				},
			});

			Res.status(404).json(Error.toJSON());

			return;
		}

		if (!UserGuilds.Guilds.includes(Encryption.Encrypt(Req.params.guildId ?? ''))) {
			options.App.Logger.debug('User is not in the guild');

			Error.AddError({
				GuildId: {
					Code: 'UnknownGuild',
					Message: 'The guild is Invalid, Does not exist or you are not in it.',
				},
			});

			Res.status(404).json(Error.toJSON());

			return;
		}

		const GuildMember = await options.App.Cassandra.Models.GuildMember.get(
			{
				UserId: Encryption.Encrypt(Req.user.Id),
				GuildId: Encryption.Encrypt(Req.params.guildId ?? ''),
			},
			{
				allowFiltering: true,
			},
		);

		const Guild = await options.App.Cassandra.Models.Guild.get(
			{
				GuildId: Encryption.Encrypt(Req.params.guildId ?? ''),
			},
			{
				fields: ['name', 'features', 'owner_id'],
			},
		);

		if (!GuildMember || !Guild) {
			options.App.Logger.debug('Guild or GuildMember not found', GuildMember, Guild);

			Error.AddError({
				GuildId: {
					Code: 'UnknownGuild',
					Message: 'The guild is Invalid, Does not exist or you are not in it.',
				},
			});

			Res.status(404).json(Error.toJSON());

			return;
		}

		const MemberFlags = new GuildMemberFlags(GuildMember.Flags);

		if (!MemberFlags.has('In')) {
			options.App.Logger.debug(`User is not in the guild, instead ${MemberFlags.toArray().join(', ')}`);

			Error.AddError({
				GuildId: {
					Code: 'UnknownGuild',
					Message: 'The guild is Invalid, Does not exist or you are not in it.',
				},
			});

			Res.status(404).json(Error.toJSON());

			return;
		}

		Req.guild = {
			Guild: {
				Features: Guild.Features ?? [],
				Id: Req.params.guildId ?? '',
				Name: Encryption.Decrypt(Guild.Name),
				OwnerId: Encryption.Decrypt(Guild.OwnerId),
			},
			GuildMember: {
				...Encryption.CompleteDecryption(GuildMember),
				Flags: MemberFlags,
				Timeouts: GuildMember.Timeouts ?? [],
			},
		};

		next();
	};
};

export default Guild;

export { Guild };
