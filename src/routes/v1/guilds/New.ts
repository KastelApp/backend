import { Route } from '@kastelll/packages';
import User from '../../../Middleware/User';

new Route('/new', 'POST', [
    User({
        AccessType: 'LoggedIn',
        AllowedRequesters: 'All',
        Flags: [],
        DisallowedFlags: ['GuildBan'] // If a user has this flag they are not allowed to create new guilds (mass guild spammer)
    })
], async (req, res) => {});