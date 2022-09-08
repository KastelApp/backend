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

const userMiddleware = require('../../../../../utils/middleware/user');
const speakeasy = require('speakeasy');
const userSchema = require('../../../../../utils/schemas/users/userSchema');
const schemaData = require('../../../../../utils/schemaData');
const { compare, hash } = require('bcrypt');
const {
    encrypt,
    completeDecryption,
    completeEncryption,
    decrypt,
} = require('../../../../../utils/classes/encryption');
const Route = require('../../../../../utils/classes/Route');


new Route(__dirname, '/', 'patch', [userMiddleware({
    login: {
        loginRequired: true,
    },
})], async (req, res) => {

    /**
     * @type {UserUpdatingData}
     */
    const { email, username, tag, newPassword, password, ip_verify, ip_lock, ips, code } = req.body;

    const user = await userSchema.findById(encrypt(req.user.id));

    if (!user) {
        res.status(500).send({
            code: 500,
            errors: [{
                code: 'ERROR',
                message: 'There was an error while trying to fetch your account. Please report this.',
            }],
            responses: [],
        });

        return;
    }

    const usr = await completeDecryption(user.toJSON());

    if (typeof email !== 'undefined' || typeof ip_verify !== 'undefined' || typeof ip_lock !== 'undefined' || typeof ips !== 'undefined') {

        if (usr.email !== email || newPassword || usr.ip_verify !== ip_verify || usr.ip_lock !== ip_lock || usr.ips !== ips) {
            if (!password) {
                res.status(401).send({
                    code: 401,
                    errors: [{
                        code: 'MISSING_PASSWORD',
                        message: 'Please provide a password',
                     }],
                    responses: [],
                });

                return;
            }

            if (!(await compare(password, usr.password))) {
                res.status(401).send({
                    code: 401,
                    errors: [{
                        code: 'INVALID_PASSWORD',
                        message: 'The password provided is invalid',
                    }],
                    responses: [],
                });

                return;
            }

            if (usr.two_fa) {

                if (!usr.two_fa_verified) {
                    res.status(403).send({
                        code: 403,
                        errors: [{
                            code: 'TWO_FA_NOT_VERIFIED',
                            message: 'The account you are trying to modify does not have 2fa verified',
                        }],
                        responses: [],
                    });

                    return;
                }

                if (!code) {
                    res.status(403).send({
                        code: 403,
                        errors: [{
                            code: 'TWO_FA_CODE_REQURIED',
                            message: 'The account you are trying to modify has 2fa enabled, Please enter a code',
                        }],
                        responses: [],
                    });

                    return;
                }

                if (!usr.twofa_secret) {
                    res.status(500).send({
                        code: 500,
                        errors: [{
                            code: 'TWO_FA_SECRET_MISSING',
                            message: '2FA\'s secret is missing, Please report this.',
                         }],
                        responses: [],
                    });

                    return;
                }

                const verified = speakeasy.totp.verify({
                    secret: decrypt(usr.twofa_secret),
                    encoding: 'base32',
                    token: code,
                });

                if (!verified) {
                    res.status(401).send({
                        code: 401,
                        errors: [{
                            code: 'INVALID_TWO_FA_CODE',
                            message: 'The code you provided is invalid, Please try again.',
                         }],
                        responses: [],
                    });

                    return;
                }
            }
        }
    }

    const updatedIps = (ips ?? usr.ips) ?? [];

    if (!updatedIps.includes(req.clientIp)) updatedIps.push(req.clientIp);

    /**
     * @type {UpdatedData}
     */
    let dataUpdated = {
        email: (email ?? usr.email) ?? 'unknown@unknowntld.unk',
        username: (username ?? usr.username) ?? 'Ghost',
        password: (newPassword ? await hash(newPassword, 10) : usr.password),
        ips: updatedIps,
        tag: (String(Number((tag ?? usr.tag) ?? '1'))).padStart(4, '0'),
        ip_verify: (ip_verify ?? usr.ip_verify) ?? false,
        ip_lock: (ip_lock ?? usr.ip_lock) ?? false,
    };

    const decrypted = completeEncryption({
        email: dataUpdated.email,
        username: dataUpdated.username,
    });

    dataUpdated = {
        ...dataUpdated,
        ...decrypted,
    };

    const tempArray = [];

    for (const ip of dataUpdated.ips) {
        tempArray.push(encrypt(ip));
    }

    dataUpdated.ips = tempArray;

    if (!(Number(dataUpdated.tag) <= 9999) || !(Number(dataUpdated.tag >= 1))) {
        res.status(400).send({
            code: 400,
            errors: [{
                code: 'INVALID_TAG',
                message: 'Please provide a valid tag',
            }],
            responses: [],
        });

        return;
    }

    const checks = {
        userandtagCheck: await userSchema.findOne({
            username: dataUpdated.username,
            tag: dataUpdated.tag,
        }),
        emailCheck: await userSchema.findOne({
            email: dataUpdated.email,
        }),
    };

    if (checks.userandtagCheck && checks.userandtagCheck._id !== user._id) {
        res.status(403).send({
            code: 403,
            errors: [{
                code: 'USERNAME_AND_TAG_TAKEN',
                message: 'Sorry, The username and tag you provided is already taken',
            }],
            responses: [],
        });

        return;
    }

    if (checks.emailCheck && checks.emailCheck._id !== user._id) {
        res.status(403).send({
            code: 403,
            errors: [{
                code: 'EMAIL_ALREADY_USED',
                message: 'Sorry, The email provided is already used!',
            }],
            responses: [],
        });

        return;
    }

    const updated = await userSchema.findByIdAndUpdate(user._id, {
        ...dataUpdated,
    });

    res.send({
        code: 200,
        errors: [],
        responses: [{
            code: 'ACCOUNT_UPDATED',
            message: 'Your account has been updated',
        }],
        data: (schemaData('user', completeDecryption(updated.toJSON()))),
    });
});

/**
 * @typedef {Object} UserUpdatingData
 * @property {String} email The Users new Email to be attached to the account
 * @property {String} username The Users new Username they want
 * @property {String|Number} tag The new tag they want
 * @property {String} newPassword If they are updating their password the newPassword field will be the new password
 * @property {String} password For most of these options the user requires to send the password
 * @property {String} code The TwoFa code
 * @property {Boolean} ip_verify If they want the ips to be verified
 * @property {Boolean} ip_lock If they want the ips to be locked
 * @property {String[]} ips The ips the user wants to allow on the account
 */

/**
 * @typedef {Object} UpdatedData
 * @property {String} email
 * @property {String} username The Users new Username they want
 * @property {String} password For most of these options the user requires to send the password
 * @property {String[]} ips The ips the user wants to allow on the account
 * @property {String|Number} tag The new tag they want
 * @property {Boolean} ip_verify If they want the ips to be verified
 * @property {Boolean} ip_lock If they want the ips to be locked
 */