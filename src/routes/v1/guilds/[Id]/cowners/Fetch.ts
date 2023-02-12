import { Route } from '@kastelll/packages';
import User from '../../../../../Middleware/User';

new Route('/', 'GET', [
    User({
        AccessType: 'LoggedIn',
        AllowedRequesters: 'User',
    })
], async (req, res) => {});