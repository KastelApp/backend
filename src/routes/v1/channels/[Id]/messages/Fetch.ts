import { HTTPErrors, Route, Snowflake } from '@kastelll/packages';
import User from '../../../../../Middleware/User';

new Route('/', 'GET', [
    User({
        AccessType: 'LoggedIn',
        AllowedRequesters: 'All',
        Flags: []
    })
], async (req, res) => {

    const { Id } = req.params as { Id: string };
    const { limit, before, after } = req.query as { limit: string, before: string, after: string };

    const CanRead = await req.mutils.Channel.hasPermission(Id, [
        'ReadMessages',
        'Administrator'
    ], true);

    if (!CanRead) {
        const MissingPermissions = new HTTPErrors(4021);

        MissingPermissions.addError({
            Channel: {
                code: 'MissingPermissions',
                message: 'You are missing the permissions to read messages in this channel.'
            },
        });

        res.status(403).json(MissingPermissions.toJSON());

        return;
    }

    const Limit = isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100 ? 50 : Number(limit);
    const Before = before ? Snowflake.validate(before) ? before : undefined : undefined;
    const After = after ? Snowflake.validate(after) ? after : undefined : undefined;
    const msgs = await req.mutils.Channel.fetchMessages(Id, Limit, Before, After);

    res.json(msgs || []);
});