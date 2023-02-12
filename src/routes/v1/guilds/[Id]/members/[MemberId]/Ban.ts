import { Route } from '@kastelll/packages';
import User from '../../../../../../Middleware/User';

new Route('/ban', 'DELETE', [
    User({
        AccessType: 'LoggedIn',
        AllowedRequesters: 'All',
    })
], async (req, res) => {});