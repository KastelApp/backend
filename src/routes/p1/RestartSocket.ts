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

import { HTTPErrors } from '@kastelll/util';
import { Route } from '@kastelll/core';
import crypto from 'crypto';
import Config from '../../Config';
import IpUtils from '../../Utils/Classes/IpUtils';

// This route is used to restart connection to the socket server, its only accessible by the socket server itself
new Route('/restart', 'GET', [], (req, res) => {
	const FourOhFourError = new HTTPErrors(404, {
		routes: {
			code: 'RouteNotFound',
			message: 'The route you requested does not exist.',
		},
	}).toJSON();

	const { pass } = req.query as { pass: string };

	if (!IpUtils.IsLocalIp(req.clientIp)) {
		res.status(404).send(FourOhFourError);

		return;
	}

	if (!crypto.timingSafeEqual(Buffer.from(pass), Buffer.from(Config.Ws.Password))) {
		res.status(404).send(FourOhFourError);

		return;
	}

	req.app.socket.HandleDisconnect(true);

	res.send({
		Code: 200,
		Message: {
			Status: 'OK',
			Message: 'Restarted socket server',
		},
	});
});
