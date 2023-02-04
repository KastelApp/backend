import { HTTPErrors, Route, Snowflake } from '@kastelll/packages';
import Constants from '../../Constants';
import Encryption from '../../Utils/Classes/Encryption';
import { SettingSchema, UserSchema } from '../../Utils/Schemas/Schemas';
import { Config } from '../../Config';
import { hashSync } from 'bcrypt';
import Token from '../../Utils/Classes/Token';
import TagGenerator from '../../Utils/TagGenerator';

new Route('/register', 'POST', [], async (req, res) => {
    const { username, email, password }: { username: string, email: string; password: string, invite?: string } = req.body;

    if (!email || !password || !username) {
        const Errors = new HTTPErrors(4007);

        if (!email) Errors.addError({ email: { code: 'EmailRequired', message: 'Email is required' } });

        if (!password) Errors.addError({ password: { code: 'PasswordRequired', message: 'Password is required' } });

        if (!username) Errors.addError({ username: { code: 'UsernameRequired', message: 'Username is required' } });

        res.status(400).json(Errors.toJSON());

        return;
    }

    const UsersCache = await req.app.cache.get(`fullusers:${Encryption.encrypt(email)}`) || await UserSchema.findOne({ Email: Encryption.encrypt(email) });
    const CountedUsers = await UserSchema.countDocuments({ Username: Encryption.encrypt(username) });
    
    if (UsersCache || CountedUsers >= Constants.Settings.Max.UsernameCount) {
        const Errors = new HTTPErrors(4008);

        if (UsersCache) Errors.addError({ email: { code: 'EmailTaken', message: 'Email is taken' } });

        if (CountedUsers >= Constants.Settings.Max.UsernameCount) Errors.addError({ username: { code: 'UsernameTaken', message: 'Username is taken' } });

        res.status(400).json(Errors.toJSON());

        return;
    }

    if (!password.match(Config.Regexs.password) || !email.match(Config.Regexs.email) || !(username.length >= Constants.Settings.Min.UsernameLength) || !(username.length <= Constants.Settings.Max.UsernameLength)) {
        const Errors = new HTTPErrors(4009);

        if (!password.match(Config.Regexs.password)) Errors.addError({ password: { code: 'PasswordInvalid', message: 'Password is invalid' } });

        if (!email.match(Config.Regexs.email)) Errors.addError({ email: { code: 'EmailInvalid', message: 'Email is invalid' } });

        if (!(username.length >= Constants.Settings.Min.UsernameLength) || !(username.length <= Constants.Settings.Max.UsernameLength)) Errors.addError({ username: { code: 'UsernameInvalid', message: 'Username is invalid' } });


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
        token: UserToken,
        user: {
            id: Encryption.decrypt(User._id),
            username: username,
            tag: User.Tag,
            avatar: null,
            flags: 0,
            email: email,
        }
    });

    return;
    
});