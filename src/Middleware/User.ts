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
import { UserMiddleware } from '../Types/Routes';

/**
 * The Middleware on each and every request (well it should be on it)
 * Manages everything user related to what type of user can access (bot or normal user)
 * and what flags are needed/allowed to access the endpoint, As well as if they need to be
 * logged in or not
 */
const User = (options: UserMiddleware) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        next();
    };
};


export default User

export { User }