import { Route } from '@kastelll/core';
import User from '../../../../Middleware/User.js';
import { UserSchema } from '../../../../Utils/Schemas/Schemas.js';
import Encryption from '../../../../Utils/Classes/Encryption.js';
import { HTTPErrors } from '@kastelll/util';
import schemaData from '../../../../Utils/SchemaData.js';

new Route(
	'/',
	'GET',
	[
		User({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'User',
			DisallowedFlags: [],
		}),
	],
	async (req, res) => {
		
		const { Id } = req.params as { Id: string };
		
		const User = await UserSchema.findById(Encryption.encrypt(Id));
		
		if (!User) {
			const Error = new HTTPErrors(4_052, {
				User: {
					Code: "UserNotFound",
					Message: "User not found",
				}
			});
			
			res.status(404).json(Error.toJSON());
			
			return;
		}

		const UserDecrypted = Encryption.completeDecryption(User.toJSON());
		
		const UserData = schemaData('FriendUser', UserDecrypted);
		
		res.status(200).json(UserData);
	},
);
