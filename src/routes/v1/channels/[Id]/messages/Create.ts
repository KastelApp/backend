import { Route } from '@kastelll/packages';
import User from '../../../../../Middleware/User';

new Route('/', 'POST', [
    User({
        AccessType: 'LoggedIn',
        AllowedRequesters: 'All',
        Flags: []
    })
], async (req, res) => {});