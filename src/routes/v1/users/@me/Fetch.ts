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

import { Route } from '@kastelll/packages';
import User from '../../../../Middleware/User';
import type { UserAtMe } from '../../../../Types/Users/Users';
import FlagFields from '../../../../Utils/Classes/BitFields/Flags';
import schemaData from '../../../../Utils/SchemaData';

new Route('/', 'GET', [User({
    AccessType: 'LoggedIn',
    AllowedRequesters: 'All',
    Flags: []
})], async (req, res) => {

    const FixedUser = schemaData('User', req.user) as UserAtMe;

    FixedUser.PublicFlags = FlagFields.RemovePrivateFlags(FixedUser.PublicFlags);

    res.json(FixedUser);
})