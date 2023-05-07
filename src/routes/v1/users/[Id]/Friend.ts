/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

import { Route } from '@kastelll/core';
import { HTTPErrors } from '@kastelll/util';
import { RelationshipFlags } from '../../../../Constants.js';
import User from '../../../../Middleware/User.js';
import Encryption from '../../../../Utils/Classes/Encryption.js';
import { FriendSchema } from '../../../../Utils/Schemas/Schemas.js';

// TODO: Make it where users can't friend themselves. (Idk why they would want to do that, but it's possible.) (they are so lonely they need to add themselves)

interface FriendRQ {
	friend: boolean;
}

new Route(
	'/friend',
	'POST',
	[
		User({
			AccessType: 'LoggedIn',
			AllowedRequesters: 'User',
			DisallowedFlags: ['FriendBan'],
		}),
	],
	async (req, res) => {
		const { friend } = req.body as FriendRQ;
		const { Id } = req.params as { Id: string };

		const VaildatedId = req.app.snowflake.Validate(Id);

		if (!VaildatedId) {
			const Errors = new HTTPErrors(4_014);

			Errors.AddError({
				Id: {
					Code: 'InvalidUser',
					Message: 'The user ID provided is invalid.',
				},
			});

			res.status(400).json(Errors.toJSON());

			return;
		}

		if (typeof friend !== 'boolean') {
			const Errors = new HTTPErrors(4_014);

			Errors.AddError({
				Friend: {
					Code: 'InvalidFriend',
					Message: 'The friend parameter must be a boolean.',
				},
			});

			res.status(400).json(Errors.toJSON());

			return;
		}

		const FriendsR = await FriendSchema.findOne({
			Receiver: Encryption.encrypt(req.user.Id),
			Sender: Encryption.encrypt(Id),
		});

		const FriendsS = await FriendSchema.findOne({
			Sender: Encryption.encrypt(req.user.Id),
			Receiver: Encryption.encrypt(Id),
		});

		if (!FriendsR && !FriendsS) {
			if (!friend) {
				const Errors = new HTTPErrors(4_015);

				Errors.AddError({
					Friend: {
						// this doesn't makse sense but idk what else to put (for now)
						Code: 'AlreadySent',
						Message: 'You have already sent this user a friend request.',
					},
				});

				res.status(400).json(Errors.toJSON());

				return;
			}

			const NewFriend = new FriendSchema({
				Sender: Encryption.encrypt(req.user.Id),
				Receiver: Encryption.encrypt(Id),
				Flags: RelationshipFlags.FriendRequest,
			});

			await NewFriend.save();

			res.send({
				Code: 'FriendRequestSent',
				Message: 'The friend request has been sent.',
			});

			return;
		}

		// So if the person is being sent a friend request they are able to send "true"
		// This will accept it, If they send "false" it will deny it (and in the future delete it)
		if (FriendsR) {
			await FriendsR.updateOne({
				$set: {
					Flags: friend ? RelationshipFlags.Friend : RelationshipFlags.Denied,
				},
			});

			if (friend) {
				res.send({
					Code: 'FriendRequestAccepted',
					Message: 'The friend request has been accepted.',
				});

				return;
			} else {
				res.send({
					Code: 'FriendRequestDenied',
					Message: 'The friend request has been denied.',
				});

				return;
			}
		}

		// If the person is sending a friend request they are able to send "true" as well
		// but if they send true & it is already been sent it will just throw an error
		// but if they send false it will delete the friend request
		if (FriendsS) {
			if (friend) {
				const Errors = new HTTPErrors(4_015);

				Errors.AddError({
					Friend: {
						Code: 'AlreadySent',
						Message: 'You have already sent this user a friend request.',
					},
				});

				res.status(400).json(Errors.toJSON());

				return;
			}

			await FriendsS.deleteOne();

			res.send({
				Code: 'FriendRequestDeleted',
				Message: 'The friend request has been deleted.',
			});

			return;
		}

		res.status(500).json({
			Message: 'Something went wrong.',
		});
	},
);
