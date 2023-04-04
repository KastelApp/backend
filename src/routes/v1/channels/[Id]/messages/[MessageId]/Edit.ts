import { HTTPErrors, Route } from '@kastelll/packages';
import User from '../../../../../../Middleware/User';

interface MessageBody {
    content: string;
    allowedMentions: number;
    flags: number;
    embeds: {
      title?: string;
      description?: string;
      color?: number;
      timestamp?: number;
      footer?: {
        text: string;
      };
      fields?: {
        title: string;
        value: string;
      }[];
    }[];
}

new Route('/', 'PATCH', [
    User({
        AccessType: 'LoggedIn',
        AllowedRequesters: 'All',
        Flags: []
    })
], async (req, res) => {

    const { Id, MessageId } = req.params as { Id: string, MessageId: string };

    const { content, allowedMentions } = req.body as MessageBody;

    const CanEdit = await req.mutils.Channel.hasPermission(Id, [
        'SendMessages',
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

    if (!CanEdit && Message.Author.User.Id !== req.user.Id) {
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

    const EditedMessage = await req.mutils.Channel.editMessage(Id, MessageId, content, allowedMentions);

    if (!EditedMessage) {
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

    res.status(200).json(EditedMessage);

    req.app.socket.Events.MessageUpdate({
        ...EditedMessage,
        ChannelId: Id
    })
});