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

import { HTTPErrors, Route } from '@kastelll/packages';
import User from '../Utils/Classes/User';

import { User as UserMiddleware } from '../Middleware/User'

new Route('/tests', 'get', [
    UserMiddleware({
        AccessType: 'LoggedIn',
        AllowedRequesters: 'User'
    })
], async (req, res) => {
    const errors = new HTTPErrors(52512);

    errors.addError({
        Username: {
            code: "InvalidUsername",
            message: "The username is invalid"
        },
        Password: {
            code: "InvalidPassword",
            message: "The password is invalid!"
        }
    })

    const user = new User(req.user.Token, req, res);

    user.SetFailed(errors.code);

    console.log(await user.fetchFriends())

    res.json(errors.toJSON())
});