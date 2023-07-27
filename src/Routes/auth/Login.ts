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

import { compareSync } from "bcrypt";
import type { Request, Response } from "express";
import Constants from "../../Constants.js";
import Captcha from "../../Middleware/Captcha.js";
import User from "../../Middleware/User.js";
import type App from "../../Utils/Classes/App";
import FlagFields from "../../Utils/Classes/BitFields/Flags.js";
import Encryption from "../../Utils/Classes/Encryption.js";
import ErrorGen from "../../Utils/Classes/ErrorGen.js";
import Route from "../../Utils/Classes/Route.js";
import Token from "../../Utils/Classes/Token.js";
import { SettingSchema, UserSchema } from "../../Utils/Schemas/Schemas.js";

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

interface LoginBody {
    Email: string;
    Password: string;
}

export default class Login extends Route {
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

        this.Routes = ['/login'];
    }

    public override async Request(Req: Request, Res: Response) {
        const { Email, Password } = Req.body as LoginBody;

        if (!Email || !Password) {
            const Error = ErrorGen.MissingAuthField();

            if (!Email) {
                Error.AddError({
                    Email: {
                        Code: 'InvalidEmail',
                        Message: 'The Email provided is Invalid, Missing or already in use',
                    }
                });
            }

            if (!Password) {
                Error.AddError({
                    Password: {
                        Code: 'InvalidPassword',
                        Message: 'The Password provided is Invalid, or Missing',
                    }
                });
            }

            Res.send(Error.toJSON());

            return;
        }

        const FetchedUser = await this.FetchUser(Email);

        if (!FetchedUser) {
            const Error = ErrorGen.MissingAuthField();

            Error.AddError({
                Email: {
                    Code: 'InvalidEmail',
                    Message: 'The Email provided is Invalid, Missing or already in use',
                }
            });

            Res.send(Error.toJSON());

            return;
        }

        const UserFlags = new FlagFields(FetchedUser.Flags);

        if (UserFlags.hasString('AccountDeleted') || UserFlags.hasString('WaitingOnDisableDataUpdate') || UserFlags.hasString('WaitingOnAccountDeletion')) {
            const Error = ErrorGen.AccountNotAvailable();

            Error.AddError({
                Email: {
                    Code: 'AccountDeleted',
                    Message: 'The Account has been deleted',
                }
            });

            Res.send(Error.toJSON());

            return;
        }

        if (UserFlags.hasString('Terminated') || UserFlags.hasString('Disabled')) {
            const Error = ErrorGen.AccountNotAvailable();

            Error.AddError({
                Email: {
                    Code: 'AccountDisabled',
                    Message: 'The Account has been disabled',
                }
            });

            Res.send(Error.toJSON());

            return;
        }

        if (!compareSync(Password, FetchedUser.Password)) {
            const Error = ErrorGen.InvalidCredentials();

            Error.AddError({
                Password: {
                    Code: 'InvalidPassword',
                    Message: 'The Password provided is Invalid, or Missing',
                }
            });

            Res.send(Error.toJSON());

            return;
        }

        const NewToken = Token.GenerateToken(Encryption.decrypt(FetchedUser._id));

        const Settings = await SettingSchema.findOne({
            User: FetchedUser._id
        });

        if (Settings) {
            Settings.Tokens.push({
                Token: Encryption.encrypt(NewToken),
                CreatedDate: Date.now(),
                Ip: Encryption.encrypt(Req.ip),
                Flags: 0
            });

            await Settings.save();
        } else {
            const NewSettings = new SettingSchema({
                User: FetchedUser._id,
                Tokens: [
                    {
                        Token: Encryption.encrypt(NewToken),
                        CreatedDate: Date.now(),
                        Ip: Encryption.encrypt(Req.ip),
                        Flags: 0
                    }
                ]
            });

            await NewSettings.save();
        }


        Res.send({
            Token: NewToken,
        });
    }

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
}
