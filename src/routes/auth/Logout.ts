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
import User from '../../Middleware/User';
import Encryption from '../../Utils/Classes/Encryption';
import { SettingSchema } from '../../Utils/Schemas/Schemas';

new Route('/logout', 'GET', [
    User({
        AccessType: 'LoggedIn',
        AllowedRequesters: 'User',
        Flags: []
    })
], async (req, res) => {

    const FoundSchema = await SettingSchema.findOne({ User: Encryption.encrypt(req.user.id) });

    if (FoundSchema) {
        FoundSchema.Tokens = FoundSchema.Tokens.filter(Token => Token !== Encryption.encrypt(req.user.Token));

        await FoundSchema.save();
    } else {
        res.status(500).json({ message: 'Internal Server Error' }); // how did this happen? lol

        return;
    }

    res.json({ message: 'Logged out' });

});