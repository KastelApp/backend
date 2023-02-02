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

new Route('/tests', 'get', [], (req, res) => {
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

    const user = new User('123');

    user.SetFailed(errors.code);

    user.flush();

    res.json(errors.toJSON())
});