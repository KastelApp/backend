import { Route } from '@kastelll/core';
import { HTTPErrors } from '@kastelll/util';
import User from '../../../../Middleware/User.js';
import GuildMemberFlags from '../../../../Utils/Classes/BitFields/GuildMember';
import Encryption from '../../../../Utils/Classes/Encryption.js';
import schemaData from '../../../../Utils/SchemaData.js';
import { GuildMemberSchema, GuildSchema } from '../../../../Utils/Schemas/Schemas.js';

new Route(
	'/',
	'GET',
	[
		User({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'All',
			DisallowedFlags: [],
		}),
	],
	async (req, res) => {
		const { Id } = req.params as { Id: string };
		const { include } = req.query as { include: string };

		let ToInclude: ('coowners' | 'owner')[] = [];

		if (include) {
			ToInclude = include.split(',') as ('coowners' | 'owner')[];

			// if there are any invalid includes, return an error
			if (ToInclude.some((Include) => !['coowners', 'owner'].includes(Include))) {
				const Errors = new HTTPErrors(4_014);

				Errors.AddError({
					Include: {
						Code: 'InvalidInclude',
						Message: 'The include parameter must be a comma seperated list of owner, coowners.',
					},
				});

				res.status(400).json(Errors.toJSON());

				return;
			}
		}

		const GuildData = await GuildSchema.findById(Encryption.encrypt(Id));

		if (!GuildData) {
			const Errors = new HTTPErrors(4_020);

			Errors.AddError({
				Guild: {
					Code: 'InvalidGuild',
					Message: 'The guild you are trying to fetch does not exist or you do not have permission to view it.',
				},
			});

			res.status(400).json(Errors.toJSON());

			return;
		}

		const UserInSideTheServer = await GuildMemberSchema.findOne({
			User: Encryption.encrypt(req.user.Id),
			Guild: Encryption.encrypt(Id),
		});

		if (!UserInSideTheServer) {
			const Errors = new HTTPErrors(4_020);

			Errors.AddError({
				Guild: {
					Code: 'InvalidGuild',
					Message: 'The guild you are trying to fetch does not exist or you do not have permission to view it.',
				},
			});

			res.status(400).json(Errors.toJSON());

			return;
		}

		const MemberFlags = new GuildMemberFlags(UserInSideTheServer.Flags ?? 0);

		if (!MemberFlags.hasString('In')) {
			const Errors = new HTTPErrors(4_020);

			Errors.AddError({
				Guild: {
					Code: 'InvalidGuild',
					Message: 'The guild you are trying to fetch does not exist or you do not have permission to view it.',
				},
			});

			res.status(400).json(Errors.toJSON());

			return;
		}

		if (ToInclude.includes('owner')) {
			await GuildData.populate('Owner');

			await GuildData.populate('Owner.User');
			await GuildData.populate('Owner.Roles');
		}

		if (ToInclude.includes('coowners')) {
			await GuildData.populate('CoOwners');

			await GuildData.populate('CoOwners.User');
			await GuildData.populate('CoOwners.Roles');
		}

		// NW = No Owner
		// NC = No Coowner
		// NCW = No Coowner & owner
		const GuildDataSchemaed = schemaData(
			ToInclude.join(',') === 'owner,coowners'
				? 'Guild'
				: ToInclude.join(',') === 'owner'
				? 'SpecialGuildNC'
				: ToInclude.join(',') === 'coowners'
				? 'SpecialGuildNW'
				: 'SpecialGuildNCW',
			Encryption.completeDecryption({
				...GuildData.toObject(),
			}),
		);

		res.status(200).json({
			...GuildDataSchemaed,
			Channels: [],
			Roles: [],
			Bans: [],
			Invites: [],
			Emojis: [],
			Members: [],
		});
	},
);
