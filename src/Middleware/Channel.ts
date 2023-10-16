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
import ErrorGen from '../Utils/Classes/ErrorGen.ts';

const Channel = (options: GuildMiddleware) => {
	return async (Req: Request<{ channelId?: string }>, Res: Response, next: NextFunction) => {
		const Error = ErrorGen.UnknownChannel();

		if ((options.Required && !Req.params.channelId) || !Req.user?.Id) {
			options.App.Logger.debug('Channel is required but not provided');

			Error.AddError({
				ChannelId: {
					Code: 'UnknownChannel',
					Message: 'The channel is Invalid, Does not exist or you do not have permissions to view it.',
				},
			});

			Res.status(404).json(Error.toJSON());

			return;
		}

		next();
	};
};

export default Channel;

export { Channel };
