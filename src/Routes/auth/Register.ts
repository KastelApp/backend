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

import { hashSync } from "bcrypt";
import type { Request, Response } from "express";
import Constants from "../../Constants.js";
import Captcha from "../../Middleware/Captcha.js";
import User from "../../Middleware/User.js";
import type App from "../../Utils/Classes/App";
import Encryption from "../../Utils/Classes/Encryption.js";
import ErrorGen from "../../Utils/Classes/ErrorGen.js";
import Route from "../../Utils/Classes/Route.js";
import Token from "../../Utils/Classes/Token.js";
import { SettingSchema, UserSchema } from "../../Utils/Schemas/Schemas.js";
import TagGenerator from "../../Utils/TagGenerator.js";

interface SchemaUser {
    AccountDeletionInProgress: boolean;
    Avatar: string;
    BanReason: string;
    Banned: boolean;
    Bots: string[];
    Dms: string[];
    Email: string;
    EmailVerified: boolean;
    Flags: number;
    GlobalNickname: string;
    GroupChats: string[];
    Guilds: string[];
    Ips: string[];
    Locked: boolean;
    Password: string;
    PhoneNumber: string;
    Tag: string;
    TwoFa: boolean;
    TwoFaSecret: string;
    TwoFaVerified: boolean;
    Username: string;
    _id: string;
}


interface RegisterBody {
    Email: string;
    Invite?: string;
    Password: string;
    Username: string;
}

export default class Register extends Route {
    public constructor(App: App) {
        super(App);

        this.Methods = ['POST'];

        this.Middleware = [
            User({
                AccessType: 'LoggedOut',
                AllowedRequesters: 'User',
            }),
            Captcha({
                Enabled: Constants.Settings.Captcha.Register,
            }),
        ];

        this.AllowedContentTypes = [];

        this.Routes = ['/register'];
    }

    public override async Request(Req: Request, Res: Response) {
        const { Email, Password, Username } = Req.body as RegisterBody;

        const PlusReplace = /\+([^@]+)/g; // eslint-disable-line prefer-named-capture-group
        const PasswordValidtor = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()-=_+{};:<>,.?/~]{6,72}$/g; // eslint-disable-line unicorn/better-regex
        const EmailValidator = /^[\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,}$/g;
        const UsernameValidator = /^(?=.*[a-zA-Z0-9!$%^&*()\-_~>.<?/\s\u0020-\uD7FF\uE000-\uFFFD])[a-zA-Z0-9!$%^&*()\-_~>.<?/\s\u0020-\uD7FF\uE000-\uFFFD]{2,30}$/g; // eslint-disable-line unicorn/better-regex

        if (!EmailValidator.test(Email) || !PasswordValidtor.test(Password) || !UsernameValidator.test(Username)) {
            const Error = ErrorGen.MissingAuthField();

            if (!EmailValidator.test(Email)) {
                Error.AddError({
                    Email: {
                        Code: 'InvalidEmail',
                        Message: 'The Email provided is Invalid, Missing or already in use',
                    }
                });
            }

            if (!PasswordValidtor.test(Password)) {
                Error.AddError({
                    Password: {
                        Code: 'InvalidPassword',
                        Message: 'The Password provided is Invalid, or Missing',
                    }
                });
            }

            if (!UsernameValidator.test(Username)) {
                Error.AddError({
                    Username: {
                        Code: 'InvalidUsername',
                        Message: 'The Username provided is Invalid, or Missing',
                    }
                });
            }

            Res.send(Error);

            return;
        }

        const CleanedEmail = Email.replaceAll(PlusReplace, '');
        const UserExists = await this.FetchUser(CleanedEmail);
        const MaxUsernamesReached = await this.MaxUsernamesReached(Username);
        const Failed = ErrorGen.FailedToRegister();

        if (UserExists) {
            Failed.AddError({
                Email: {
                    Code: 'InvalidEmail',
                    Message: 'The Email provided is Invalid, Missing or already in use',
                }
            });
        }

        if (MaxUsernamesReached) {
            Failed.AddError({
                Username: {
                    Code: 'InvalidUsername',
                    Message: 'The Username provided is Invalid, or Missing',
                }
            });
        }

        if (Object.keys(Failed.Errors).length > 0) {
            Res.send(Failed.toJSON());

            return;
        }

        const Tag = await this.GenerateTag(Username);

        const NewUser = new UserSchema({
            _id: Encryption.encrypt(this.App.Snowflake.Generate()),
            Email: Encryption.encrypt(CleanedEmail),
            Username: Encryption.encrypt(Username),
            Password: hashSync(Password, 10),
            PhoneNumber: null,
            Tag,
            Avatar: null,
            Ips: [],
            Bots: [],
            Dms: [],
            Flags: 0,
            GlobalNickname: null,
            Guilds: [],
            TwoFaSecret: null,
        });

        const NewToken = Token.GenerateToken(Encryption.decrypt(NewUser._id));

        const Settings = new SettingSchema({
            User: NewUser._id,
            Tokens: [
                {
                    Token: Encryption.encrypt(NewToken),
                    CreatedDate: Date.now(),
                    Ip: Encryption.encrypt(Req.ip),
                    Flags: 0
                }
            ]
        });

        await Promise.all([
            NewUser.save(),
            Settings.save()
        ]);

        await this.App.Cache.set(`users:${NewUser._id}:${Encryption.encrypt(CleanedEmail)}`, NewUser.toJSON());

        console.log(`users:${NewUser._id}:${Encryption.encrypt(CleanedEmail)}`);

        Res.send({
            Token: NewToken,
            User: {
                Id: Encryption.decrypt(NewUser._id),
                Email: CleanedEmail,
                Username,
                Tag,
                Avatar: null,
                PublicFlags: 0,
            }
        });
    }

    // private async FetchInvite(Invite: string): Promise<void> {
    //     if (Invite) {
    //         // waffles
    //     }
    // }

    private async FetchUser(Email: string): Promise<SchemaUser | null> {
        const Keys = await this.App.Cache.scan({
            match: `users:*:${Encryption.encrypt(Email)}`,
            count: 10
        });


        if (Keys.length > 0) {
            const FetchedUser = await this.App.Cache.get(Keys[0] as string) as SchemaUser | null;

            if (FetchedUser) {
                return FetchedUser;
            }
        }

        const InDb = await UserSchema.findOne({
            Email: Encryption.encrypt(Email)
        });

        if (InDb) {
            await this.App.Cache.set(`users:${InDb._id}:${Encryption.encrypt(Email)}`, InDb.toJSON());

            return InDb.toJSON();
        }

        return null;
    }

    private async MaxUsernamesReached(Username: string): Promise<boolean> {
        const Max = await UserSchema.countDocuments({
            Username
        });

        return Max >= Constants.Settings.Max.UsernameCount;
    }

    private async GenerateTag(Username: string): Promise<string> {
        const InUseTags = await UserSchema.find({
            Username
        });

        const Tags = InUseTags.map((User) => User.Tag);

        return TagGenerator(Tags);
    }
}
