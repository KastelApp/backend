import { Route } from '@kastelll/core';
import User from '../../../../../Middleware/User';
import { HTTPErrors } from '@kastelll/util';

/*

            - `name` - The name of the channel (String) (Required)
            - `description` - The description of the channel (String) (Optional)
            - `type` - The type of the channel (Number) (Required)
            - `nsfw` - Whether the channel is nsfw (Boolean) (Optional)
            - `allowedMentions` - Check the [Allowed Mentions](#allowed-mentions) section for more info (Number) (Optional)
            - `parent` - The parent of the channel (String) (Optional)
            - `position` - The position of the channel (Number) (Optional)
            - `children` - The children of the channel (Array of Strings) (Optional) (if parent is specified this is not allowed)
            - `permissionsOverides` - The permissions overides for the channel (Array) (Optional)
              - `id` - The id of the role or user (String) (Required)
              - `type` - The type of the overide (Number) (Required)
              - `allow` - The permissions to allow (String) (Required)
              - `deny` - The permissions to deny (String) (Required)

 */

interface RouteBody {
	name: string;
	description?: string;
	type: number;
	nsfw?: boolean;
	allowedMentions?: number;
	parent?: string;
	position?: number;
	children?: string[];
	permissionsOverides?: {
		id: string;
		type: number;
		allow: string;
		deny: string;
	}[];
}

new Route(
	'/',
	'POST',
	[
		User({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'All',
			DisallowedFlags: [],
		}),
	],
	async (req, res) => {
		const { name, type, description } = req.body as RouteBody;
		const { Id } = req.params as { Id: string };
		
		const CanSend = await req.mutils.User.hasPermission(Id, ['ManageChannels', 'Administrator'], true);
		
		if (!CanSend) {
			const Errors = new HTTPErrors(4021);
			
			Errors.AddError({
				Guild: {
					Code: 'MissingPermissions',
					Message: 'The Guild you are trying to create a channel in does not exist or you do not have permission to create a channel',
				}
			});
			
			res.status(400).json(Errors.toJSON());
			
			return;
		}
		
		
		console.log(name, type, description);
	},
);
