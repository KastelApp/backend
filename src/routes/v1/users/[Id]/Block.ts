import { HTTPErrors, Route, Snowflake } from '@kastelll/packages';
import { RelationshipFlags } from '../../../../Constants';
import User from '../../../../Middleware/User';
import Encryption from '../../../../Utils/Classes/Encryption';
import { FriendSchema } from '../../../../Utils/Schemas/Schemas';

interface BlockRQ {
    blocked: boolean;
}

// Notes: Client side they should be the one checking if the user is blocked or not.
// We will not be checking if the user is blocked or not server side. (Besides dming & creating dms etc)

new Route('/block', 'PUT', [
    User({
        AccessType: 'LoggedIn',
        AllowedRequesters: 'User',
        DisallowedFlags: ['FriendBan']
    })
], async (req, res) => {

    const { blocked } = req.body as BlockRQ;
    const { Id } = req.params as { Id: string };

    const VaildatedId = Snowflake.validate(Id);

    if (!VaildatedId) {
        const Errors = new HTTPErrors(4014)

        Errors.addError({
            id: {
                code: 'InvalidUser',
                message: 'The user ID provided is invalid.'
            }
        })

        res.status(400).json(Errors.toJSON());

        return;
    }

    if (!(typeof blocked === 'boolean')) {
        const Errors = new HTTPErrors(4014)

        Errors.addError({
            friend: {
                code: 'InvalidBlocked',
                message: 'The Blocked parameter must be a boolean.'
            }
        })

        res.status(400).json(Errors.toJSON());

        return;
    }

    const FriendsR = await FriendSchema.findOne({
        Receiver: Encryption.encrypt(req.user.Id),
        Sender: Encryption.encrypt(Id)
    })

    const FriendsS = await FriendSchema.findOne({
        Sender: Encryption.encrypt(req.user.Id),
        Receiver: Encryption.encrypt(Id)
    })

    if (!FriendsR && !FriendsS) {
        
        if (!blocked) {
            const Errors = new HTTPErrors(4015)

            Errors.addError({
                friend: {
                    code: 'NotBlocked',
                    message: 'The user is not blocked.'
                }
            })

            res.status(400).json(Errors.toJSON());

            return;
        }

        const Block = new FriendSchema({
            Sender: Encryption.encrypt(req.user.Id),
            Receiver: Encryption.encrypt(Id),
            Flags: RelationshipFlags.Blocked
        })

        await Block.save();

        res.status(200).json({
            message: 'User has been blocked.'
        })

        return;
    }

    if (FriendsR) {
        if (FriendsR.Flags === RelationshipFlags.Blocked) {
            if (!blocked) {
                await FriendSchema.deleteOne({
                    Receiver: Encryption.encrypt(req.user.Id),
                    Sender: Encryption.encrypt(Id)
                })

                res.status(200).json({
                    message: 'User has been unblocked.'
                })

                return;
            }

            const Errors = new HTTPErrors(4015)

            Errors.addError({
                friend: {
                    code: 'AlreadyBlocked',
                    message: 'The user is already blocked.'
                }
            })

            res.status(400).json(Errors.toJSON());

            return;
        }

        await FriendSchema.updateOne({
            Receiver: Encryption.encrypt(req.user.Id),
            Sender: Encryption.encrypt(Id)
        }, {
            Flags: RelationshipFlags.Blocked
        })

        res.status(200).json({
            message: 'User has been blocked.'
        })

        return;
    }

    if (FriendsS) {
        if (FriendsS.Flags === RelationshipFlags.Blocked) {
            if (!blocked) {
                await FriendSchema.deleteOne({
                    Sender: Encryption.encrypt(req.user.Id),
                    Receiver: Encryption.encrypt(Id)
                })

                res.status(200).json({
                    message: 'User has been unblocked.'
                })

                return;
            }

            const Errors = new HTTPErrors(4015)

            Errors.addError({
                friend: {
                    code: 'AlreadyBlocked',
                    message: 'The user is already blocked.'
                }
            })

            res.status(400).json(Errors.toJSON());

            return;
        }

        await FriendSchema.updateOne({
            Sender: Encryption.encrypt(req.user.Id),
            Receiver: Encryption.encrypt(Id)
        }, {
            Flags: RelationshipFlags.Blocked
        })

        res.status(200).json({
            message: 'User has been blocked.'
        })

        return;
    }

    res.status(500).json({
        message: 'Something went wrong.'
    })

});