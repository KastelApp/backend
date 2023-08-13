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

import type { Request, Response } from 'express';
import { RelationshipFlags, Settings } from '../../../../Constants.js';
import User from '../../../../Middleware/User.js';
import type App from '../../../../Utils/Classes/App.js';
import FlagRemover from '../../../../Utils/Classes/BitFields/FlagRemover.js';
import { FlagUtils } from '../../../../Utils/Classes/BitFields/NewFlags.js';
import Encryption from '../../../../Utils/Classes/Encryption.js';
import ErrorGen from '../../../../Utils/Classes/ErrorGen.js';
import Route from '../../../../Utils/Classes/Route.js';

// note: add new gateway events for a relationship being edited / made >.<

interface NewRelationshipsBody {
	Flags: number;
	Users: string[];
}

interface SchemaUser {
	Avatar: string;
	Bots: string[];
	Dms: string[];
	Email: string;
	Flags: string;
	GlobalNickname: string;
	Guilds: string[];
	Ips: string[];
	Password: string;
	PhoneNumber: string;
	Tag: string;
	TwoFaSecret: string;
	Username: string;
	_id: string;
}

interface Relationship {
	Flags: number;
	Pending: boolean;
	User: {
		Avatar: string;
		GlobalNickname: string;
		Id: string;
		PublicFlags: number;
		Tag: string;
		Username: string;
	};
}

export default class Friends extends Route {
	private readonly MaxManagable: number = 5; // Max amount of users they can send a friend request to (/block/edit)

	private readonly AllowedFlags: (keyof typeof RelationshipFlags)[] = [
		'Blocked',
		'Denied',
		'FriendRequest',
		'Friend',
		'None',
	];

	public constructor(App: App) {
		super(App);

		this.Methods = ['GET', 'POST', 'PATCH'];

		this.Middleware = [
			User({
				AccessType: 'LoggedIn',
				AllowedRequesters: 'User',
				DisallowedFlags: ['FriendBan'],
				App
			}),
		];

		this.AllowedContentTypes = ['application/json'];

		this.Routes = ['/relationships', '/relationships/:userId'];
	}

	public override async Request(Req: Request<{ userId?: string; }>, Res: Response) {
		if (Req.methodi !== 'GET' && Req.params.userId) {
			Req.fourohfourit();

			return;
		}

		switch (Req.method.toLowerCase()) {
			case 'patch': {
				await this.PostRelationship(Req, Res);

				break;
			}

			case 'get': {
				await this.GetRelationships(Req, Res);

				break;
			}

			case 'post': {
				await this.PostRelationship(Req, Res);

				break;
			}

			default: {
				this.App.Logger.warn(`Weird Bypass in Method (${Req.method})`);

				Res.status(500).send('Internal Server Error :(');

				break;
			}
		}
	}

	private async GetRelationships(Req: Request<{ userId?: string; }>, Res: Response) {
		const FetchedFriends = (await this.FetchRelationship(Req.user.Id)).filter(
			(friend) => !new FlagUtils<typeof RelationshipFlags>(friend.Flags, RelationshipFlags).hasString('Denied'),
		);

		if (Req.params.userId) {
			const FoundUser = FetchedFriends.find((friend) => friend.User.Id === Req.params.userId);

			if (FoundUser) {
				Res.send([FoundUser]);

				return;
			}

			Res.send([]);

			return;
		}

		Res.send(FetchedFriends);
	}

	// private async PostRelationship(Req: Request<any, any, NewRelationshipsBody>, Res: Response) {
	// 	const { Flags, Users } = Req.body;

	// 	if (!Flags || !Array.isArray(Users)) {
	// 		const Error = ErrorGen.MissingField();

	// 		if (!Flags) {
	// 			Error.AddError({
	// 				Flags: {
	// 					Code: 'MissingOrInvalidFlags',
	// 					Message: 'The Flags provided were Invalid or Missing.'
	// 				}
	// 			});
	// 		}

	// 		if (!Array.isArray(Users)) {
	// 			Error.AddError({
	// 				Users: {
	// 					Code: 'MissingOrInvalidUsers',
	// 					Message: 'The Users provided were Invalid or Missing.'
	// 				}
	// 			});
	// 		}

	// 		Res.status(401).send(Error.toJSON());

	// 		return;
	// 	}

	// 	if (Users.length > this.MaxManagable) {
	// 		const Error = ErrorGen.LimitReached();

	// 		Error.AddError({
	// 			Users: {
	// 				Code: 'LimitReached',
	// 				Message: `Wow there buck'o, You can only manage ${this.MaxManagable} users at a time`
	// 			}
	// 		});

	// 		Res.status(401).send(Error.toJSON());

	// 		return;
	// 	}

	// 	const RelationshipFlag = new FlagUtils<typeof RelationshipFlags>(Flags, RelationshipFlags);

	// 	if (RelationshipFlag.toArray().length !== 1 || !this.AllowedFlags.some((value) => RelationshipFlag.hasString(value))) {
	// 		const Error = ErrorGen.MissingField();

	// 		Error.AddError({
	// 			Flags: {
	// 				Code: 'MissingOrInvalidFlags',
	// 				Message: 'The Flags provided were Invalid or Missing.'
	// 			}
	// 		});

	// 		Res.status(401).send(Error.toJSON());

	// 		return;
	// 	}

	// 	const Error = ErrorGen.IssueWithFriend();
	// 	const UserSet = Array.from(new Set(Users));
	// 	const UserErrors = [];
	// 	const FitUsers: {
	// 		Schema: ((Document<unknown, {}, {
	// 			Flags: number;
	// 			Receiver: string;
	// 			SentFriendRequest: string;
	// 			User: string;
	// 		}> & {
	// 			_id: Types.ObjectId;
	// 		} & {
	// 			Flags: number;
	// 			Receiver: string;
	// 			SentFriendRequest: string;
	// 			User: string;
	// 		}) | null),
	// 		UserId: string;
	// 	}[] = [];

	// 	const Counted = await this.CountFriends(Req.user.Id, RelationshipFlags.Friend);

	// 	if (Counted >= Settings.Max.FriendCount || (Counted + UserSet.length) >= Settings.Max.FriendCount + 1) {
	// 		const LimitReachedError = ErrorGen.LimitReached();

	// 		LimitReachedError.AddError({
	// 			Friends: {
	// 				Code: 'FriendLimitReached',
	// 				Message: 'Buck\'o, You\'ve reached (or will reach) your friend limit, please remove some friends :('
	// 			}
	// 		});

	// 		Res.status(401).send(LimitReachedError.toJSON());

	// 		return;
	// 	}

	// 	for (const User of UserSet) {
	// 		if (User === Req.user.Id) {
	// 			UserErrors.push({
	// 				index: Users.indexOf(User),
	// 				Error: {
	// 					Code: 'InvalidUser',
	// 					Message: `The User provided is ones self.`
	// 				}
	// 			});

	// 			continue;
	// 		}

	// 		const FetchedUser = await this.FetchUser(User);

	// 		if (!FetchedUser) {
	// 			UserErrors.push({
	// 				index: Users.indexOf(User),
	// 				Error: {
	// 					Code: 'InvalidUser',
	// 					Message: 'The user provided is Invalid or has blocked you.'
	// 				}
	// 			});

	// 			continue;
	// 		}

	// 		const FoundRelationship = await FriendSchema.findOne({
	// 			Receiver: Encryption.encrypt(User)
	// 		}) ?? await FriendSchema.findOne({
	// 			User: Encryption.encrypt(User)
	// 		});

	// 		if (Req.method.toLowerCase() === "post") {
	// 			if (FoundRelationship) {
	// 				UserErrors.push({
	// 					index: Users.indexOf(User),
	// 					Error: {
	// 						Code: 'AlreadyInRelationship', // aww how cute
	// 						Message: 'The User provided is already in a Relationship with you.'
	// 					}
	// 				});

	// 				continue;
	// 			}

	// 			FitUsers.push({
	// 				Schema: null,
	// 				UserId: User
	// 			});
	// 		} else if (Req.method.toLowerCase() === "patch") {
	// 			if (!FoundRelationship) {
	// 				UserErrors.push({
	// 					index: Users.indexOf(User),
	// 					Error: {
	// 						Code: 'NotInRelationship',
	// 						Message: 'The User provided is not in a Relationship with you.'
	// 					}
	// 				});

	// 				continue;
	// 			}

	// 			FitUsers.push({
	// 				Schema: FoundRelationship,
	// 				UserId: User
	// 			});
	// 		}
	// 	}

	// 	if (UserErrors.length > 0) {
	// 		Error.AddError({
	// 			Users: UserErrors.reduce((prev: { [key: string]: { Code: string, Message: string; }; }, value) => {
	// 				prev[value.index] = value.Error;
	// 				return prev;
	// 			}, {})
	// 		});
	// 	}

	// 	if (Object.keys(Error.Errors).length > 0) {
	// 		Res.status(401).send(Error.toJSON());

	// 		return;
	// 	}

	// 	for (const FitUser of FitUsers) {
	// 		if (Req.method.toLowerCase() === "post") {
	// 			const NewRelationship = new FriendSchema({
	// 				User: Encryption.encrypt(Req.user.Id),
	// 				Receiver: Encryption.encrypt(FitUser.UserId),
	// 				Flags
	// 			});

	// 			await NewRelationship.save();
	// 		} else if (Req.method.toLowerCase() === 'patch') {
	// 			if (!FitUser.Schema) {
	// 				continue;
	// 			}

	// 			FitUser.Schema.Flags = Flags;

	// 			await FitUser.Schema.save();
	// 		}
	// 	}

	// 	const NewRelationships = await this.FetchRelationship(Req.user.Id, true);

	// 	for (const FitUser of FitUsers) {
	// 		const Found = NewRelationships.find((Friend) => Friend.User.Id === FitUser.UserId);

	// 		if (!Found) continue;

	// 		this.App.SystemSocket.Events.RelationshipUpdate({
	// 			Causer: Req.user,
	// 			To: Found
	// 		});
	// 	}

	// 	Res.status(204).end();
	// }

	private async PostRelationship(Req: Request<any, any, NewRelationshipsBody>, Res: Response) {
		const { Flags, Users } = Req.body;

		if (!Flags || !Array.isArray(Users)) {
			const Error = ErrorGen.MissingField();

			if (!Flags) {
				Error.AddError({
					Flags: {
						Code: 'MissingOrInvalidFlags',
						Message: 'The Flags provided were Invalid or Missing.',
					},
				});
			}

			if (!Array.isArray(Users)) {
				Error.AddError({
					Users: {
						Code: 'MissingOrInvalidUsers',
						Message: 'The Users provided were Invalid or Missing.',
					},
				});
			}

			Res.status(400).send(Error.toJSON());

			return;
		}

		if (Users.length > this.MaxManagable) {
			const Error = ErrorGen.LimitReached();

			Error.AddError({
				Users: {
					Code: 'LimitReached',
					Message: `Wow there buck'o, You can only manage ${this.MaxManagable} users at a time`,
				},
			});

			Res.status(400).send(Error.toJSON());

			return;
		}

		const RelationshipFlag = new FlagUtils<typeof RelationshipFlags>(Flags, RelationshipFlags);

		if (
			RelationshipFlag.toArray().length !== 1 ||
			!this.AllowedFlags.some((value) => RelationshipFlag.hasString(value))
		) {
			const Error = ErrorGen.MissingField();

			Error.AddError({
				Flags: {
					Code: 'MissingOrInvalidFlags',
					Message: 'The Flags provided were Invalid or Missing.',
				},
			});

			Res.status(400).send(Error.toJSON());

			return;
		}

		const Error = ErrorGen.IssueWithFriend();
		const UserSet = Array.from(new Set(Users));
		const UserErrors = [];
		const FitUsers: {
			RelationshipFlags: FlagUtils<typeof RelationshipFlags>;
			Schema:
			| (Document<unknown, {}, {
					Flags: number;
					Nicknames: {
						By: string;
						For: string;
						Nickname: string;
					}[];
					Receiver: string;
					Sender: string;
					SentFriendRequest: string;
				}
			> & {
				_id: Types.ObjectId;
			} & {
				Flags: number;
				Nicknames: {
					By: string;
					For: string;
					Nickname: string;
				}[];
				Receiver: string;
				Sender: string;
				SentFriendRequest: string;
			})
			| null;
			UserId: string;
		}[] = [];

		const Counted = await this.CountFriends(Req.user.Id, RelationshipFlags.Friend);

		if (Counted >= Settings.Max.FriendCount || Counted + UserSet.length >= Settings.Max.FriendCount + 1) {
			const LimitReachedError = ErrorGen.LimitReached();

			LimitReachedError.AddError({
				Friends: {
					Code: 'FriendLimitReached',
					Message: "Buck'o, You've reached (or will reach) your friend limit, please remove some friends :(",
				},
			});

			Res.status(400).send(LimitReachedError.toJSON());

			return;
		}

		for (const User of UserSet) {
			if (User === Req.user.Id) {
				UserErrors.push({
					index: Users.indexOf(User),
					Error: {
						Code: 'InvalidUser',
						Message: `The User provided is ones self.`,
					},
				});

				continue;
			}

			const FetchedUser = await this.FetchUser(User);

			if (!FetchedUser) {
				UserErrors.push({
					index: Users.indexOf(User),
					Error: {
						Code: 'InvalidUser',
						Message: 'The user provided is Invalid or has blocked you.',
					},
				});

				continue;
			}

			const FoundRelationship =
				(await FriendSchema.findOne({
					Receiver: Encryption.encrypt(User),
				})) ??
				(await FriendSchema.findOne({
					User: Encryption.encrypt(User),
				}));

			const FoundRelationshipFlags = new FlagUtils<typeof RelationshipFlags>(
				FoundRelationship?.Flags ?? 0,
				RelationshipFlags,
			);

			if (Req.methodi === 'POST') {
				if (
					FoundRelationship &&
					!(FoundRelationshipFlags.hasString('Denied') || FoundRelationshipFlags.hasString('Blocked'))
				) {
					UserErrors.push({
						index: Users.indexOf(User),
						Error: {
							Code: 'AlreadyInRelationship', // aww how cute
							Message: 'The User provided is already in a Relationship with you.',
						},
					});

					continue;
				} else if (
					!FoundRelationship &&
					(RelationshipFlag.hasString('None') ||
						RelationshipFlag.hasString('Denied') ||
						RelationshipFlag.hasString('Friend'))
				) {
					UserErrors.push({
						index: Users.indexOf(User),
						Error: {
							Code: 'MissingOrInvalidFlags',
							Message: 'The Flags provided were Invalid or Missing.',
						},
					});

					continue;
				}
			} else if (Req.methodi === 'PATCH') {
				if (!FoundRelationship) {
					UserErrors.push({
						index: Users.indexOf(User),
						Error: {
							Code: 'RelationshipDoesNotExist',
							Message: 'The User provided is not in a Relationship with you.',
						},
					});

					continue;
				}

				if (
					(FoundRelationshipFlags.hasString('Blocked') &&
						!FoundRelationship.WhoBlockedWho.includes(Encryption.encrypt(Req.user.Id)) &&
						!RelationshipFlag.hasString('Blocked')) ||
					(FoundRelationship.WhoBlockedWho.includes(Encryption.encrypt(Req.user.Id)) &&
						!RelationshipFlag.hasString('None'))
				) {
					UserErrors.push({
						index: Users.indexOf(User),
						Error: {
							Code: 'InvalidUser',
							Message: 'The user provided is Invalid or has blocked you.',
						},
					});

					continue;
				}
			}

			FitUsers.push({
				Schema: FoundRelationship,
				UserId: User,
				RelationshipFlags: FoundRelationshipFlags,
			});
		}

		if (UserErrors.length > 0) {
			Error.AddError({
				Users: UserErrors.reduce((prev: { [key: string]: { Code: string; Message: string; }; }, value) => {
					prev[value.index] = value.Error;
					return prev;
				}, {}),
			});
		}

		if (Object.keys(Error.Errors).length > 0) {
			Res.status(400).send(Error.toJSON());

			return;
		}

		for (const FitUser of FitUsers) {
			if (Req.methodi === 'POST' && !FitUser.Schema) {
				const NewFoundRelationship = new FriendSchema({
					User: Encryption.encrypt(Req.user.Id),
					Receiver: Encryption.encrypt(FitUser.UserId),
					SentFriendRequest: RelationshipFlag.hasString('FriendRequest') ? Encryption.encrypt(Req.user.Id) : null,
					WhoBlockedWho: RelationshipFlag.hasString('Blocked') ? [Encryption.encrypt(Req.user.Id)] : [],
					Flags,
				});

				await NewFoundRelationship.save();
			} else if (Req.methodi === 'PATCH' && !FitUser.Schema) continue; // should never happen
		}

		console.log('ok');
	}

	private async FetchUser(UserId: string, Email?: string): Promise<SchemaUser | null> {
		if (UserId && Email) {
			const InCache = await this.App.Cache.get(`users:${Encryption.encrypt(UserId)}:${Encryption.encrypt(Email)}`);

			if (InCache) {
				this.App.Logger.debug('[Fetching user] Using Cache!');

				return Encryption.completeDecryption(InCache);
			}
		} else {
			const ScannedKeys = await this.App.Cache.scan({
				match: `users:${Encryption.encrypt(UserId)}:*`,
				count: 10,
			});

			if (ScannedKeys.length > 0) {
				const FetchedUser = (await this.App.Cache.get(ScannedKeys[0] as string)) as SchemaUser | null;

				if (FetchedUser) {
					this.App.Logger.debug('[Fetching user] Using Cache!');

					return Encryption.completeDecryption(FetchedUser);
				}
			}
		}

		const User = await UserSchema.findById(Encryption.encrypt(UserId));

		if (!User) {
			this.App.Logger.debug("[Fetching user] No Cache of user (and couldn't find em)");

			return null;
		}

		const UserJson = User.toJSON();

		await this.App.Cache.set(`users:${UserJson._id}:${UserJson.Email}`, UserJson);

		this.App.Logger.debug('[Fetching user] Had to hard fetch, set them in cache though.');

		return Encryption.completeDecryption(UserJson);
	}

	private async FetchRelationship(UserId: string, Reset?: boolean): Promise<Relationship[]> {
		const InCache = await this.App.Cache.get(`relationships:${Encryption.encrypt(UserId)}`);

		if (InCache && !Reset) {
			this.App.Logger.debug('[Fetching relationships] Using Cache!');

			return Encryption.completeDecryption(InCache);
		}

		const [Receiver, User] = (await Promise.all([
			FriendSchema.find({
				Receiver: Encryption.encrypt(UserId),
			}),
			FriendSchema.find({
				User: Encryption.encrypt(UserId),
			}),
		])) as unknown as [
				(Document<
					unknown,
					{},
					{
						Flags: number;
						Receiver: string;
						SentFriendRequest: string;
						User: SchemaUser;
					}
				> & {
					_id: Types.ObjectId;
				} & {
					Flags: number;
					Receiver: string;
					SentFriendRequest: string;
					User: SchemaUser;
				})[],
				(Document<
					unknown,
					{},
					{
						Flags: number;
						Receiver: SchemaUser;
						SentFriendRequest: string;
						User: string;
					}
				> & {
					_id: Types.ObjectId;
				} & {
					Flags: number;
					Receiver: SchemaUser;
					SentFriendRequest: string;
					User: string;
				})[],
			];

		const Promises: Promise<any>[] = [];

		for (const Recive of Receiver) {
			Promises.push(Recive.populate('User'));
		}

		for (const Sender of User) {
			Promises.push(Sender.populate('Receiver'));
		}

		this.App.Logger.debug(`Wowie, Theres a total of ${Promises.length} Promises.. dats a lot :(>|<):`);

		await Promise.all(Promises);

		// SentFriendRequest is the id of the user who sent the friend request
		// If its null then pending will be false, if the user didn't send the friend request then pending will be true and if they were the one who sent it then pending is false
		// ikik its complicated

		const MappedSender = User.map((Document) => {
			return {
				User: {
					Id: Document.Receiver._id,
					Username: Document.Receiver.Username,
					GlobalNickname: Document.Receiver.GlobalNickname,
					Tag: Document.Receiver.Tag,
					Avatar: Document.Receiver.Avatar,
					PublicFlags: Number(FlagRemover.RemovePrivateNormalFlags(BigInt(Document.Receiver.Flags))),
				},
				Flags: Document.Flags,
				Pending: Document.SentFriendRequest ? Encryption.decrypt(Document.SentFriendRequest) !== UserId : false,
			};
		});

		const MappedReceiver = Receiver.map((Document) => {
			return {
				User: {
					Id: Document.User._id,
					Username: Document.User.Username,
					GlobalNickname: Document.User.GlobalNickname,
					Tag: Document.User.Tag,
					Avatar: Document.User.Avatar,
					PublicFlags: Number(FlagRemover.RemovePrivateNormalFlags(BigInt(Document.User.Flags))),
				},
				Flags: Document.Flags,
				Pending: Document.SentFriendRequest ? Encryption.decrypt(Document.SentFriendRequest) !== UserId : false,
			};
		});

		const Mixed = [...MappedSender, ...MappedReceiver];

		await this.App.Cache.set(`relationships:${Encryption.encrypt(UserId)}`, Mixed);

		return Encryption.completeDecryption(Mixed);
	}

	private async CountFriends(UserId: string, RequiredFlags?: number) {
		const [Receiver, User] = await Promise.all([
			FriendSchema.countDocuments({
				Receiver: Encryption.encrypt(UserId),
				...(RequiredFlags ? { Flags: RequiredFlags } : {}),
			}),
			FriendSchema.countDocuments({
				User: Encryption.encrypt(UserId),
				...(RequiredFlags ? { Flags: RequiredFlags } : {}),
			}),
		]);

		return Receiver + User;
	}
}
