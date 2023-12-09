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

import type { NextFunction, Request, Response } from "express";

// Notes, This is a User Based **AND** IP Based Rate limiter.
// Changing your IP and using the same account will not let you bypass rate limits
// and changing accounts while using the same ip will also not yet you bypass it.

// To Do: Rate Limits should have a set limit but should also be dynamic,
// If Someone keeps hitting the max limit in a certain amount of time make the limit lower
// and the reset time longer

const Ratelimit = () => {
	return async (_: Request, __: Response, next: NextFunction) => {
		next();
	};
};

export default Ratelimit;

export { Ratelimit };
