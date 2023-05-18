import { Route } from '@kastelll/core';
import { HTTPErrors } from '@kastelll/util';
import Constants from '../../../Constants.js';
import User from '../../../Middleware/User.js';
import type { Guild } from '../../../Types/Guilds/Guild';
import Encryption from '../../../Utils/Classes/Encryption.js';
import schemaData from '../../../Utils/SchemaData.js';
import { UserSchema } from '../../../Utils/Schemas/Schemas.js';

new Route(
	'/fetch',
	'GET',
	[
		User({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'All',
			Flags: [],
		}),
	],
	async (req, res) => {
		const { include, limit } = req.query as {
			after: string;
			before: string;
			include: string;
			limit: string;
		};

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

		if (limit) {
			const Errors = new HTTPErrors(4_014);

			if (Number.parseInt(limit, 10) > Constants.Settings.Max.GuildFetchLimit) {
				Errors.AddError({
					Limit: {
						Code: 'InvalidLimit',
						Message: `The limit parameter must be less than or equal to ${Constants.Settings.Max.GuildFetchLimit}.`,
					},
				});
			} else if (Number.parseInt(limit, 10) < 1) {
				Errors.AddError({
					Limit: {
						Code: 'InvalidLimit',
						Message: `The limit parameter must be greater than or equal to 1.`,
					},
				});
			} else if (Number.isNaN(Number.parseInt(limit, 10))) {
				Errors.AddError({
					Limit: {
						Code: 'InvalidLimit',
						Message: `The limit parameter must be a number.`,
					},
				});
			}

			if (Object.keys(Errors.Errors).length > 0) {
				res.status(400).json(Errors.toJSON());

				return;
			}
		}

		const FoundUser = await UserSchema.findById(Encryption.encrypt(req.user.Id));

		if (!FoundUser) {
			res.status(500).send('Internal Server Error');

			return;
		}

		await FoundUser.populate('Guilds');

		if (ToInclude.includes('owner')) {
			await FoundUser.populate('Guilds.Owner');
			await FoundUser.populate('Guilds.Owner.User');
			await FoundUser.populate('Guilds.Owner.Roles');
		}

		if (ToInclude.includes('coowners')) {
			await FoundUser.populate('Guilds.Coowners');
			await FoundUser.populate('Guilds.Coowners.User');
			await FoundUser.populate('Guilds.Coowners.Roles');
		}

		// NW = No Owner
		// NC = No Coowner
		// NCW = No Coowner & owner
		const GuildDataSchemaed = schemaData(
			ToInclude.join(',') === 'owner,coowners'
				? 'Guilds'
				: ToInclude.join(',') === 'owner'
				? 'SpecialGuildsNC'
				: ToInclude.join(',') === 'coowners'
				? 'SpecialGuildsNW'
				: 'SpecialGuildsNCW',
			Encryption.completeDecryption(FoundUser.toObject().Guilds),
		) as Guild[];

		const GuildData = GuildDataSchemaed.map((Guild) => {
			return {
				...Guild,
				Channels: [],
				Roles: [],
				Bans: [],
				Invites: [],
				Emojis: [],
				Members: [],
			};
		});

		// limits to the amount of guilds the user wants limited to (default is 100)
		if (limit) {
			res.status(200).json(GuildData.slice(0, Number.parseInt(limit, 10)));

			return;
		}

		res.status(200).json(GuildData.slice(0, 100));
	},
);
