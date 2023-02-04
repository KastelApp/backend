import { Route } from '@kastelll/packages';
import User from '../../../../Middleware/User';

new Route('/transfer', 'PUT', [
    User({
        AccessType: 'LoggedIn',
        AllowedRequesters: 'All',
        DisallowedFlags: ['GuildBan']
    })
], async (req, res) => {});