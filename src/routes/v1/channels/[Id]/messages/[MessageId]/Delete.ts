import { HTTPErrors, Route } from '@kastelll/packages';
import User from '../../../../../../Middleware/User';

new Route('/', 'DELETE', [
    User({
        AccessType: 'LoggedIn',
        AllowedRequesters: 'All',
        Flags: []
    })
], async (req, res) => {

    const { Id, MessageId } = req.params as { Id: string, MessageId: string };

    const CanDelete = await req.mutils.Channel.hasPermission(Id, [
        'ManageMessages',
        'Administrator'
    ], true);

    const Message = await req.mutils.Channel.fetchMessage(Id, MessageId);

    if (!Message) {
        const Errors = new HTTPErrors(4052);

        Errors.addError({
            MessageIds: {
                code: 'InvalidMessageIds',
                message: 'The message ids are invalid.'
            },
        });

        res.status(400).json(Errors.toJSON());

        return;
    }

    if (!CanDelete && Message.Author.User.Id !== req.user.Id) {
        const MissingPermissions = new HTTPErrors(4021);

        MissingPermissions.addError({
            Channel: {
                code: 'MissingPermissions',
                message: 'You are missing the permissions to manage messages in this channel.'
            },
        });

        res.status(403).json(MissingPermissions.toJSON());

        return;
    }

    const DeletedMessage = await req.mutils.Channel.deleteMessages(Id, [MessageId]);

    if (!DeletedMessage) {
        const Errors = new HTTPErrors(4052);

        Errors.addError({
            MessageIds: {
                code: 'InvalidMessageIds',
                message: 'The message ids are invalid.'
            },
        });

        res.status(400).json(Errors.toJSON());

        return;
    }

    res.status(204).send();

    req.app.socket.Events.MessageDelete({
        Id: MessageId,
        AuthorId: Message.Author.User.Id,
        ChannelId: Id,
        Timestamp: Date.now()
    })
});