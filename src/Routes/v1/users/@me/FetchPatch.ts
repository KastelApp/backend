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

import { compareSync, hashSync } from 'bcrypt';
import type { Request, Response } from 'express';
import User from '../../../../Middleware/User.js';
import type App from '../../../../Utils/Classes/App';
import FlagRemover from '../../../../Utils/Classes/BitFields/FlagRemover.js';
import FlagFields from '../../../../Utils/Classes/BitFields/Flags.js';
import Encryption from '../../../../Utils/Classes/Encryption.js';
import ErrorGen from '../../../../Utils/Classes/ErrorGen.js';
import Route from '../../../../Utils/Classes/Route.js';
import type { User as UserType } from '../../../../Utils/Cql/Types/index.js';
import { TagValidator } from '../../../../Utils/TagGenerator.js';

interface EditableSchema {
	AFlags: number;
	Avatar: string;
	Bio: string;
	Email: string;
	Flags: string;
	GlobalNickname: string;
	Guilds: string[];
	Ips: string[];
	NewPassword: string;
	Password: string;
	PhoneNumber: string;
	RFlags: number;
	Tag: string;
	TwoFaSecret: string;
	UserId: string;
	Username: string;
}

type SchemaUser = Omit<EditableSchema, 'AFlags' | 'Bio' | 'NewPassword' | 'RFlags'>;

interface UserObject {
	Avatar: string | null;
	Bio?: string;
	Email: string;
	EmailVerified: boolean;
	GlobalNickname: string | null;
	Id: string;
	PhoneNumber: string | null;
	PublicFlags: number;
	Tag: string;
	TwoFaEnabled: boolean;
	TwoFaVerified: boolean;
	Username: string;
}

interface UpdateUserBody {
	AFlags?: number;
	Avatar?: string | null;
	Bio?: string;
	Email?: string;
	GlobalNickname?: string | null;
	NewPassword?: string;
	Password?: string;
	PhoneNumber?: string;
	RFlags?: number;
	Tag?: string;
	TwoFaCode?: string;
	Username?: string;
}

export default class FetchPatchUser extends Route {
	private readonly PasswordRequired: (keyof UpdateUserBody)[];

	private readonly BotCantEdit: (keyof UpdateUserBody)[];

	private readonly Editable: (keyof EditableSchema)[];

	public constructor(App: App) {
		super(App);

		this.Methods = ['GET', 'PATCH'];

		this.Middleware = [
			User({
				AccessType: 'LoggedIn',
				AllowedRequesters: 'User',
				App
			}),
		];

		this.AllowedContentTypes = ['application/json'];

		this.Routes = ['/'];

		this.PasswordRequired = ['Email', 'PhoneNumber', 'NewPassword', 'AFlags', 'RFlags']; // These are also the fields that require a 2fa code (soon™️)

		this.BotCantEdit = ['Email', 'NewPassword', 'Password', 'PhoneNumber', 'AFlags', 'RFlags'];

		this.Editable = [
			'Avatar',
			'Email',
			'GlobalNickname',
			'Password',
			'PhoneNumber',
			'Tag',
			'Username',
			'NewPassword',
			'AFlags',
			'RFlags',
			'Bio',
		];
	}

	public override async Request(Req: Request, Res: Response) {
		switch (Req.method.toLowerCase()) {
			case 'patch': {
				await this.PatchSelf(Req, Res);

				break;
			}

			case 'get': {
				await this.FetchSelf(Req, Res);

				break;
			}

			default: {
				this.App.Logger.warn(`Weird Bypass in Method (${Req.method})`);

				Res.status(500).send('Internal Server Error :(');

				break;
			}
		}
	}

	private async PatchSelf(Req: Request<any, any, UpdateUserBody>, Res: Response) {
		const { Password } = Req.body;
		const RequestKeys = Object.keys(Req.body);
		const Error = ErrorGen.FailedToPatchUser();
		const BotNotAllowed = RequestKeys.some((y) => this.BotCantEdit.includes(y as keyof UpdateUserBody));
		const PasswordRequiredKey = RequestKeys.some((y) => this.PasswordRequired.includes(y as keyof UpdateUserBody));

		const PlusReplace = /\+([^@]+)/g; // eslint-disable-line prefer-named-capture-group
		const PasswordValidtor = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()-=_+{};:<>,.?/~]{6,72}$/; // eslint-disable-line unicorn/better-regex
		const EmailValidator = /^[\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,}$/;
		const UsernameValidator =
			/^(?=.*[a-zA-Z0-9!$%^&*()\-_~>.<?/\s\u0020-\uD7FF\uE000-\uFFFD])[a-zA-Z0-9!$%^&*()\-_~>.<?/\s\u0020-\uD7FF\uE000-\uFFFD]{2,30}$/; // eslint-disable-line unicorn/better-regex

		if (BotNotAllowed && Req.user.Bot) {
			this.App.Logger.debug('User is a bot and tried to update a value thats not allowed (Email, Password etc etc)');

			const Mapped = RequestKeys.map((key) => {
				return {
					Key: key,
					NotAllowed: this.BotCantEdit.includes(key as keyof UpdateUserBody),
				};
			});

			for (const item of Mapped) {
				if (!item.NotAllowed) continue;

				Error.AddError({
					[item.Key]: {
						Code: 'NotAllowed',
						Message: `You are not allowed to edit "${item.Key}" Due to you being a bot`,
					},
				});
			}

			Res.status(403).send(Error.toJSON());

			return;
		}

		if (PasswordRequiredKey && !Password) {
			this.App.Logger.debug('User tried to update an item that requires a password and they provided no password :(');

			Error.AddError({
				Password: {
					Code: 'InvalidPassword',
					Message: 'The Password provided is Invalid, or Missing',
				},
			});

			Res.status(403).send(Error.toJSON());

			return;
		}

		const FetchedUser = await this.FetchUser(Req.user.Id);
		const ParsedFlags = new FlagFields(FetchedUser?.Flags ?? 0);

		if (!FetchedUser) {
			this.App.Logger.debug(`Couldn't fetch the user..? Id: ${Req.user.Id}, Email: ${Req.user.Email}`);

			Res.status(500).send('Internal Server Error :(');

			return;
		}

		if (PasswordRequiredKey && !compareSync(Password ?? '', FetchedUser.Password)) {
			this.App.Logger.debug(
				'User tried to update an item that requires a password and they provided an invalid password :(',
			);

			Error.AddError({
				Password: {
					Code: 'InvalidPassword',
					Message: 'The Password provided is Invalid, or Missing',
				},
			});

			Res.status(403).send(Error.toJSON());

			return;
		}

		const FilteredItems = Object.entries(Req.body)
			.filter(([key]) => {
				return this.Editable.includes(key as keyof EditableSchema);
			})
			.reduce<{ [key: string]: number | string | null; }>((prev, [key, value]) => {
				if (!['string', 'number'].includes(typeof value)) prev[key as string] = null;

				prev[key as string] = value as number | string;

				return prev;
			}, {}) as UpdateUserBody;

		if (Object.keys(FilteredItems).length === 0) {
			Error.AddError({
				Keys: {
					Code: 'NoKeys',
					Message: 'There are no keys',
				},
			});
		}

		if (FilteredItems.Username && !UsernameValidator.test(FilteredItems.Username)) {
			Error.AddError({
				Username: {
					Code: 'InvalidUsername',
					Message: 'The Username provided is Invalid',
				},
			});
		}

		if (FilteredItems.NewPassword && !PasswordValidtor.test(FilteredItems.NewPassword)) {
			Error.AddError({
				Password: {
					Code: 'InvalidPassword',
					Message: 'The Password provided is Invalid',
				},
			});
		}

		if (FilteredItems.Email && !EmailValidator.test(FilteredItems.Email)) {
			Error.AddError({
				Email: {
					Code: 'InvalidEmail',
					Message: 'The Email provided is Invalid or already in use',
				},
			});
		}

		if (Object.keys(Error.Errors).length > 0) {
			Res.status(400).send(Error.toJSON());

			return;
		}

		const ContinuePast = ['Password', 'Bio'];
		// eslint-disable-next-line guard-for-in -- darkerink: We filtered it already.. it should be good
		for (const item in FilteredItems) {
			if (ContinuePast.includes(item)) continue;

			if (item === 'NewPassword') {
				FetchedUser.Password = hashSync(FilteredItems[item] as string, 10);

				continue;
			}

			if (item === 'Tag') {
				FetchedUser.Tag = TagValidator(FetchedUser.Tag, FilteredItems.Tag ?? '');

				continue;
			}

			// darkerink: Is there a better way to do this? yes, we could instead allow updating all flags but I would rather just support
			// removing and adding flags here and there (RFlags = Remove Flags, AFlags = Add Flags)
			if ((item === 'RFlags' || item === 'AFlags') && ParsedFlags.hasString('Staff')) {
				const Flags = FilteredItems[item] as number;

				this.App.Logger.warn(
					`[Updating User] User ${Req.user.Id} Has updated their flags, Their old flags are "${FetchedUser.Flags
					}", They are ${item === 'RFlags' ? 'Removing Flags' : 'Adding Flags'} "${Flags}"`,
				);

				const FilteredFlagsParsed = new FlagFields(
					FlagRemover.RemovePrivateNormalFlags(FlagRemover.InvalidFlagsRemover(BigInt(Flags))),
				);

				FilteredFlagsParsed.removeString('Staff'); // darkerink: We will not allow them to remove the staff flag, the staff badge is fine tho

				if (item === 'RFlags') ParsedFlags.remove(FilteredFlagsParsed.bits);
				if (item === 'AFlags') ParsedFlags.add(FilteredFlagsParsed.bits);

				FetchedUser.Flags = String(ParsedFlags.bits);

				continue;
			}

			if (item === 'Email') {
				FetchedUser.Email = (FilteredItems.Email as string).replaceAll(PlusReplace, '');
			}

			if (FetchedUser?.[item as keyof SchemaUser] === undefined) {
				this.App.Logger.debug(`Warning, FetchedUser does not have a field for ${item}`, FetchedUser, item);

				continue;
			}

			FetchedUser[item as keyof SchemaUser] = FilteredItems[item as keyof UpdateUserBody] as string[] & string;
		}

		if (FilteredItems.Email) {
			this.App.Logger.debug('Before', ParsedFlags.toArray());

			ParsedFlags.removeString('EmailVerified');

			this.App.Logger.debug('After', ParsedFlags.toArray());

			FetchedUser.Flags = String(ParsedFlags.bits);

			const FoundUser = await this.FetchUser(undefined, FilteredItems.Email);

			if (FoundUser) {
				Error.AddError({
					Email: {
						Code: 'InvalidEmail',
						Message: 'The Email provided is Invalid already in use',
					},
				});
			}
		}

		if (FilteredItems.Username && FetchedUser.Username !== FilteredItems.Username) {
			const MaxUsers = await this.MaxUsernamesReached(FilteredItems.Username);

			if (MaxUsers) {
				Error.AddError({
					Username: {
						Code: 'MaxUsernames',
						Message: 'The Username provided is Invalid',
					},
				});
			} else {
				const FoundUser = await this.UserExists(FilteredItems.Username, FilteredItems.Tag ?? FetchedUser.Tag)

				if (FoundUser) {
					Error.AddError({
						Username: {
							Code: 'InvalidUsername',
							Message: 'The Username is Invalid (Already taken :( )',
						},
					});
				}
			}
		}

		if (Object.keys(Error.Errors).length > 0) {
			Res.status(400).send(Error.toJSON());

			return;
		}

		await this.App.Cassandra.Models.User.update({
			...Encryption.completeEncryption(FetchedUser),
			Tag: FetchedUser.Tag,
			Password: FetchedUser.Password,
			Flags: FetchedUser.Flags,
		});


		const UserObject: UserObject = {
			Id: FetchedUser.UserId,
			Email: FetchedUser.Email,
			EmailVerified: ParsedFlags.hasString('EmailVerified'),
			Username: FetchedUser.Username,
			GlobalNickname: FetchedUser.GlobalNickname.length === 0 ? null : FetchedUser.GlobalNickname,
			Tag: FetchedUser.Tag,
			Avatar: FetchedUser.Avatar.length === 0 ? null : FetchedUser.Avatar,
			PublicFlags: Number(FlagRemover.RemovePrivateNormalFlags(BigInt(FetchedUser.Flags))),
			PhoneNumber: null,
			TwoFaEnabled: ParsedFlags.hasString('TwoFaEnabled'),
			TwoFaVerified: ParsedFlags.hasString('TwoFaVerified'),
		};

		if (FilteredItems.Bio) {
			UserObject.Bio = String(FilteredItems.Bio);

			await this.App.Cassandra.Models.Settings.update({
				UserId: Encryption.encrypt(UserObject.Id),
				Bio: Encryption.encrypt(String(UserObject.Bio)),
			});
		}

		this.App.SystemSocket.Events.UpdateUser(UserObject);

		Res.send(UserObject);
	}

	private async FetchSelf(Req: Request, Res: Response) {
		const { include } = Req.query;

		const FetchedUser = await this.FetchUser(Req.user.Id);

		if (!FetchedUser) {
			this.App.Logger.debug(`Couldn't fetch the user..? Id: ${Req.user.Id}, Email: ${Req.user.Email}`);

			Res.status(500).send('Internal Server Error :(');

			return;
		}

		const Flags = new FlagFields(FetchedUser.Flags);
		const SplitInclude = String(include).split(',');

		const UserObject: UserObject = {
			Id: FetchedUser.UserId,
			Email: FetchedUser.Email,
			EmailVerified: Flags.hasString('EmailVerified'),
			Username: FetchedUser.Username,
			GlobalNickname: FetchedUser.GlobalNickname.length === 0 ? null : FetchedUser.GlobalNickname,
			Tag: FetchedUser.Tag,
			Avatar: FetchedUser.Avatar.length === 0 ? null : FetchedUser.Avatar,
			PublicFlags: Number(FlagRemover.RemovePrivateNormalFlags(BigInt(FetchedUser.Flags))),
			PhoneNumber: null,
			TwoFaEnabled: Flags.hasString('TwoFaEnabled'),
			TwoFaVerified: Flags.hasString('TwoFaVerified'),
		};

		if (SplitInclude.includes('bio')) {
			const Settings = await this.App.Cassandra.Models.Settings.get({
				UserId: Encryption.encrypt(UserObject.Id),
			}, {
				fields: ['bio']
			});

			UserObject.Bio = Settings?.Bio ? Encryption.decrypt(Settings.Bio) : null;
		}

		Res.send(UserObject);
	}

	private async FetchUser(UserId?: string, Email?: string): Promise<UserType | null> {
		const FetchedUser = await this.App.Cassandra.Models.User.get({
			...(UserId ? { UserId: Encryption.encrypt(UserId) } : {}),
			...(Email ? { Email: Encryption.encrypt(Email) } : {}),
		});

		if (!FetchedUser) return null;

		return Encryption.completeDecryption({
			...FetchedUser,
			Flags: FetchedUser?.Flags ? String(FetchedUser.Flags) : '0',
		});
	}

	private async MaxUsernamesReached(Username?: string, Count?: number, Remove?: number): Promise<boolean> {
		let FoundCount = 0 - (Remove ?? 0);

		if (Count) {
			FoundCount = Count;
		} else if (Username) {
			const FoundUsers = await this.App.Cassandra.Execute(
				'SELECT COUNT(1) FROM users WHERE username = ?',
				[Encryption.encrypt(Username)]
			);

			const Value: number = FoundUsers?.first()?.get('count').toNumber() ?? 0;

			FoundCount = Value;
		}

		return FoundCount >= 9_000;
	}

	private async UserExists(Username: string, Tag: string): Promise<boolean> {
		const Users = await this.App.Cassandra.Models.User.find({
			Username: Encryption.encrypt(Username),
		}, {
			fields: ['tag']
		});

		const FoundUsers = Users.toArray();

		if (FoundUsers.length === 0) return false;

		return FoundUsers.some((User) => User.Tag === Tag);
	}
}
