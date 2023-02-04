import { Route } from '@kastelll/packages';
import User from '../../../../../../Middleware/User';

new Route('/', 'GET', [
    User({
        AccessType: 'LoggedIn',
        AllowedRequesters: 'All',
        Flags: ['Bot']
    })
], async (req, res) => {});