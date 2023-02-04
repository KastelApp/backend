import { HTTPErrors, Route, Snowflake } from '@kastelll/packages';
import { RelationshipFlags } from '../../../../Constants';
import User from '../../../../Middleware/User';
import Encryption from '../../../../Utils/Classes/Encryption';

import { FriendSchema } from '../../../../Utils/Schemas/Schemas'

// TODO: Make it where users can't friend themselves. (Idk why they would want to do that, but it's possible.) (they are so lonely they need to add themselves)

interface FriendRQ {
    friend: boolean;
}

new Route('/friend', 'POST', [
    User({
        AccessType: 'LoggedIn',
        AllowedRequesters: 'User',
        DisallowedFlags: ['FriendBan']
    })
], async (req, res) => {
    const { friend } = req.body as FriendRQ;
    const { Id } = req.params as { Id: string };

    const VaildatedId = Snowflake.validate(Id);

    if (!VaildatedId) {
        const Errors = new HTTPErrors(4016)

        Errors.addError({
            id: {
                code: 'InvalidUser',
                message: 'The user ID provided is invalid.'
            }
        })

        res.status(400).json(Errors.toJSON());

        return;
    }

    if (!(typeof friend === 'boolean')) {
        const Errors = new HTTPErrors(4017)

        Errors.addError({
            friend: {
                code: 'InvalidFriend',
                message: 'The friend parameter must be a boolean.'
            }
        })

        res.status(400).json(Errors.toJSON());

        return;
    }

    const FriendsR = await FriendSchema.findOne({
        Receiver: Encryption.encrypt(req.user.id),
        Sender: Encryption.encrypt(Id)
    })

    const FriendsS = await FriendSchema.findOne({
        Sender: Encryption.encrypt(req.user.id),
        Receiver: Encryption.encrypt(Id)
    })

    if (!FriendsR && !FriendsS) {

        if (!friend) {
            const Errors = new HTTPErrors(4018)

            Errors.addError({
                friend: { // this doesn't makse sense but idk what else to put (for now)
                    code: 'AlreadySent',
                    message: 'You have already sent this user a friend request.'
                }
            })

            res.status(400).json(Errors.toJSON());

            return;

        }

        const NewFriend = new FriendSchema({
            Sender: Encryption.encrypt(req.user.id),
            Receiver: Encryption.encrypt(Id),
            Flags: RelationshipFlags.FriendRequest
        })

        await NewFriend.save()

        res.send({
            code: "FriendRequestSent",
            message: "The friend request has been sent."
        })

        return;
    }

    // So if the person is being sent a friend request they are able to send "true"
    // This will accept it, If they send "false" it will deny it (and in the future delete it)
    if (FriendsR) {
        await FriendsR.updateOne({
            $set: {
                Flags: friend ? RelationshipFlags.Friend : RelationshipFlags.Denied
            }
        })

        // res.send(`temp (friend request ${friend ? 'accepted' : 'denied'})`)

        if (friend) {
            res.send({
                code: "FriendRequestAccepted",
                message: "The friend request has been accepted."
            })

            return;
        } else {
            res.send({
                code: "FriendRequestDenied",
                message: "The friend request has been denied."
            })

            return;
        }
    }

    // If the person is sending a friend request they are able to send "true" as well
    // but if they send true & it is already been sent it will just throw an error
    // but if they send false it will delete the friend request
    if (FriendsS) {
        if (friend) {
            const Errors = new HTTPErrors(4018)

            Errors.addError({
                friend: {
                    code: 'AlreadySent',
                    message: 'You have already sent this user a friend request.'
                }
            })

            res.status(400).json(Errors.toJSON());

            return;
        }

        await FriendsS.deleteOne()

        res.send({
            code: "FriendRequestDeleted",
            message: "The friend request has been deleted."
        })

        return;
    }

    res.status(500).json({
        message: 'Something went wrong.'
    })

});