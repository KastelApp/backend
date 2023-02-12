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

import { HTTPErrors, Route, Snowflake } from '@kastelll/packages';
import Constants from '../../Constants';
import Encryption from '../../Utils/Classes/Encryption';
import { SettingSchema, UserSchema } from '../../Utils/Schemas/Schemas';
import { Config } from '../../Config';
import { hashSync } from 'bcrypt';
import Token from '../../Utils/Classes/Token';
import TagGenerator from '../../Utils/TagGenerator';
import User from '../../Middleware/User';
import Captcha from '../../Middleware/Captcha';

new Route('/register', 'POST', [
    User({
        AccessType: 'LoggedOut',
        AllowedRequesters: 'User'
    }),
    Captcha({
        Enabled: Constants.Settings.Captcha.Register
    })
], async (req, res) => {
    const { username, email, password }: { username: string, email: string; password: string, invite?: string } = req.body;

    if (!email || !password || !username) {
        const Errors = new HTTPErrors(4007);

        if (!email) Errors.addError({ Email: { Code: 'EmailRequired', Message: 'Email is required' } });

        if (!password) Errors.addError({ password: { Code: 'PasswordRequired', Message: 'Password is required' } });

        if (!username) Errors.addError({ username: { Code: 'UsernameRequired', Message: 'Username is required' } });

        res.status(400).json(Errors.toJSON());

        return;
    }

    const UsersCache = await req.app.cache.get(`fullusers:${Encryption.encrypt(email)}`) || await UserSchema.findOne({ Email: Encryption.encrypt(email) });
    const CountedUsers = await UserSchema.countDocuments({ Username: Encryption.encrypt(username) });
    
    if (UsersCache || CountedUsers >= Constants.Settings.Max.UsernameCount) {
        const Errors = new HTTPErrors(4008);

        if (UsersCache) Errors.addError({ Email: { Code: 'EmailTaken', Message: 'Email is taken' } });

        if (CountedUsers >= Constants.Settings.Max.UsernameCount) Errors.addError({ Username: { Code: 'UsernameTaken', Message: 'Username is taken' } });

        res.status(400).json(Errors.toJSON());

        return;
    }

    if (!password.match(Config.Regexs.password) || !email.match(Config.Regexs.email) || !(username.length >= Constants.Settings.Min.UsernameLength) || !(username.length <= Constants.Settings.Max.UsernameLength)) {
        const Errors = new HTTPErrors(4009);

        if (!password.match(Config.Regexs.password)) Errors.addError({ Password: { Code: 'PasswordInvalid', Message: 'Password is invalid' } });

        if (!email.match(Config.Regexs.email)) Errors.addError({ Email: { Code: 'EmailInvalid', Message: 'Email is invalid' } });

        if (!(username.length >= Constants.Settings.Min.UsernameLength) || !(username.length <= Constants.Settings.Max.UsernameLength)) Errors.addError({ Username: { Code: 'UsernameInvalid', Message: 'Username is invalid' } });


        res.status(400).json(Errors.toJSON());

        return;
    }

    const AllUsers = await UserSchema.find({ Username: Encryption.encrypt(username) });

    const GeneratedTag = TagGenerator(AllUsers.map(User => User.Tag));

    const User = new UserSchema({
        _id: Encryption.encrypt(Snowflake.generate()),
        Email: Encryption.encrypt(email),
        EmailVerified: false,
        Username: Encryption.encrypt(username),
        Tag: GeneratedTag,
        AvatarHash: null,
        Password: hashSync(password, 10),
        PhoneNumber: null,
        TwoFa: false,
        TwoFaSecret: null,
        TwoFaVerified: false,
        Ips: [],
        Flags: 0,
        Guilds: [],
        Dms: [],
        GroupChats: [],
        Bots: [],
        Banned: false,
        BanReason: null,
        Locked: false,
        AccountDeletionInProgress: false
    });

    await User.save();

    const UserToken = Token.GenerateToken(Encryption.decrypt(User._id));

    const Settings = new SettingSchema({
        User: User._id,
        Tokens: [Encryption.encrypt(UserToken)],
    })

    await Settings.save();

    res.status(200).json({
        Token: UserToken,
        User: {
            Id: Encryption.decrypt(User._id),
            Username: username,
            Tag: User.Tag,
            Avatar: null,
            Flags: 0,
            Email: email,
        }
    });

    return;
    
});