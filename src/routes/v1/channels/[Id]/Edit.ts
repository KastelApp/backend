import { Route } from '@kastelll/packages';
import User from '../../../../Middleware/User';

new Route('/', 'PATCH', [
    User({
        AccessType: 'LoggedIn',
        AllowedRequesters: 'All',
        Flags: []
    })
], async (req, res) => {});