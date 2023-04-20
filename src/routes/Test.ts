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

import { Route } from '@kastelll/core';
import UserM from '../Middleware/User';
import Encryption from '../Utils/Classes/Encryption';

new Route('/decrypt', 'POST', [], async (req, res) => {
	const body = req.body as {
		[key: string]: string;
	};

	const DecryptedData = Encryption.completeDecryption(body);

	res.json(DecryptedData);
});

new Route(
	'/test',
	'POST',
	[
		UserM({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'User',
		}),
	],
	async (req, res) => {
		const CanSend = await req.mutils.User.canSendMessagesGuildV('296622893528518658');

		console.log(CanSend);

		res.send('Done');
	},
);
