import { Route } from '@kastelll/core';
import { HTTPErrors } from '@kastelll/util';
import Constants from '../../../Constants.js';
import User from '../../../Middleware/User.js';
import Encryption from '../../../Utils/Classes/Encryption.js';
import StringValidation from '../../../Utils/Classes/StringValidation';
import schemaData from '../../../Utils/SchemaData.js';
import {
	ChannelSchema,
	GuildMemberSchema,
	GuildSchema,
	RoleSchema,
	UserSchema,
} from '../../../Utils/Schemas/Schemas.js';

interface NewGuildBody {
	channels: {
		// NOTE, THIS WILL NOT BE THE ID OF THE CHANNEL, This will be the id just for children channels
		children: string[];
		id: string;
		name: string;
		position: number;
		type: number;
	}[];
	description: string;
	icon: string;
	name: string;
	roles: {
		color: number;
		hoist: boolean;
		mentionable: boolean;
		name: string;
		permissions: number;
		position: number;
	}[];
}

// ToDo: Have Frontend use Guild Templates of a default guild

new Route(
	'/new',
	'POST',
	[
		User({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'All',
			Flags: [],
			DisallowedFlags: ['GuildBan'], // If a user has this flag they are not allowed to create new guilds (mass guild spammer)
		}),
	],
	async (req, res) => {
		const { name, description } = req.body as NewGuildBody;

		const { data } = req.query as { data: string };

		if (!name) {
			const Errors = new HTTPErrors(4_016);

			Errors.AddError({
				Name: {
					Code: 'MissingName',
					Message: 'You must provide a name for your guild.',
				},
			});

			res.status(400).json(Errors.toJSON());

			return;
		}

		const FoundUser = await UserSchema.findById(Encryption.encrypt(req.user.Id));

		if (FoundUser?.Guilds && FoundUser.Guilds.length >= Constants.Settings.Max.GuildCount) {
			const Errors = new HTTPErrors(4_017);

			Errors.AddError({
				Guilds: {
					Code: 'MaxGuilds',
					Message: `You have reached the maximum amount of guilds you can have. (${Constants.Settings.Max.GuildCount})`,
				},
			});

			res.status(400).json(Errors.toJSON());

			return;
		}

		if (!StringValidation.GuildName(name)) {
			const Errors = new HTTPErrors(4_023);

			Errors.AddError({
				Name: {
					Code: 'InvalidName',
					message: 'The name you provided is invalid.',
				},
			});

			res.status(400).json(Errors.toJSON());

			return;
		}

		if (description && !StringValidation.GuildDescription(description)) {
			const Errors = new HTTPErrors(4_023);

			Errors.AddError({
				Description: {
					Code: 'InvalidDescription',
					message: 'The description you provided is invalid.',
				},
			});

			res.status(400).json(Errors.toJSON());

			return;
		}

		const NewGuild = new GuildSchema({
			_id: Encryption.encrypt(req.app.snowflake.Generate()),
			Description: description ? Encryption.encrypt(description) : null,
			Owner: null,
			Name: Encryption.encrypt(name),
		});

		const EveryoneRole = new RoleSchema({
			_id: NewGuild._id,
			Deleteable: false,
			Guild: NewGuild._id,
			Name: Encryption.encrypt('Everyone'),
			Permissions: String(Constants.Permissions.SendMessages | Constants.Permissions.ViewChannel),
			Hoisted: false,
			Position: 0,
		});

		const GuildOwner = new GuildMemberSchema({
			_id: Encryption.encrypt(req.app.snowflake.Generate()),
			Guild: NewGuild._id, // already encrypted
			Roles: [EveryoneRole._id],
			User: Encryption.encrypt(req.user.Id),
			Flags: Constants.GuildMemberFlags.Owner | Constants.GuildMemberFlags.In,
		});

		const GuildChannelCategory = new ChannelSchema({
			_id: Encryption.encrypt(req.app.snowflake.Generate()),
			Guild: NewGuild._id,
			Name: Encryption.encrypt('General'),
			Type: Constants.ChannelTypes.GuildCategory,
			Position: 0,
			Children: [],
			Permissions: String(Constants.Permissions.SendMessages | Constants.Permissions.ViewChannel),
		});

		const GuildChannel = new ChannelSchema({
			_id: Encryption.encrypt(req.app.snowflake.Generate()),
			Guild: NewGuild._id,
			Name: Encryption.encrypt('general'),
			Type: Constants.ChannelTypes.GuildText,
			Position: 0,
			Parent: GuildChannelCategory._id,
			Permissions: String(Constants.Permissions.SendMessages | Constants.Permissions.ViewChannel),
			Description: Encryption.encrypt('The main channel for this guild.'),
		});

		GuildChannelCategory.Children.push(GuildChannel._id);
		NewGuild.Roles.push(EveryoneRole._id);
		NewGuild.Members.push(GuildOwner._id);
		NewGuild.Channels.push(GuildChannelCategory._id);
		NewGuild.Channels.push(GuildChannel._id);
		NewGuild.Owner = GuildOwner._id;
		FoundUser?.Guilds.push(NewGuild._id);

		await NewGuild.save();
		await EveryoneRole.save();
		await GuildOwner.save();
		await GuildChannelCategory.save();
		await GuildChannel.save();
		await FoundUser?.save();

		if (data === 'true') {
			const GuildSchemaDecrypted = schemaData(
				'Guild',
				Encryption.completeDecryption({
					...NewGuild.toObject(),
					Roles: [EveryoneRole.toObject()],
					Members: [GuildOwner.toObject()].map((Member) => {
						return {
							...Member,
							User: FoundUser?.toObject(),
							Roles: [EveryoneRole.toObject()],
						};
					}),
					Channels: [GuildChannelCategory.toObject(), GuildChannel.toObject()],
					Owner: {
						...GuildOwner.toObject(),
						User: FoundUser?.toObject(),
						Roles: [EveryoneRole.toObject()],
					},
				}),
			);

			res.status(200).json(GuildSchemaDecrypted);
		} else {
			res.status(200).json({
				Id: Encryption.decrypt(NewGuild._id),
			});
		}
	},
);
