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

const { generate } = require('../../../utils/classes/snowflake');
const lengthChecker = require('../../../utils/lengthChecker');
const guildSchema = require('../../../utils/schemas/guilds/guildSchema');
const inviteSchema = require('../../../utils/schemas/guilds/inviteSchema');
const userSchema = require('../../../utils/schemas/users/userSchema');
const guildMemberSchema = require('../../../utils/schemas/guilds/guildMemberSchema');
const { hash } = require('bcrypt');
const { BADGES, FLAGS } = require('../../../constants');
const tagGenerator = require('../../../utils/tagGenerator');
const { important } = require('../../../utils/classes/logger');
const { encrypt } = require('../../../utils/classes/encryption');
const user = require('../../../utils/middleware/user');
const Route = require('../../../utils/classes/Route');

new Route(__dirname, '/register', 'POST', [user({
        login: {
            loginRequired: false,
            loginAllowed: false,
            loggedOutAllowed: true,
        },
    })],
    async (req, res) => {
        try {

            /**
             * @type {{username: String, email: String, password: String, date_of_birth: Date, invite: String}}
             */
            const { username, email, password, date_of_birth, invite } = req.body;

            if (!username || !email || !password || !date_of_birth || (new Date(date_of_birth) == 'Invalid Date')) {
                res.status(400).send({
                    code: 400,
                    errors: [!username ? {
                        code: 'MISSING_USERNAME',
                        message: 'No username provided',
            } : null, !email ? {
                        code: 'MISSING_EMAIL',
                        message: 'No email provided.',
            } : null, !password ? {
                        code: 'MISSING_PASSWORD',
                        message: 'No Password provided',
            } : null, !date_of_birth ? {
                        code: 'MISSING_DATE_OF_BIRTH',
                        message: 'No Date of birth provided',
     } : new Date(date_of_birth) == 'Invalid Date' ? {
                        code: 'INVALID_DATE_OF_BIRTH',
                        message: 'The provided Date of Birth is Invalid',
        } : null].filter((x) => x !== null),
                    responses: [],
                });

                return;
            }

            const _id = generate();
            let tag = _id.slice((_id.length - 4)) == '0000' ? '0001' : _id.slice((_id.length - 4));

            const checks = {
                age: lengthChecker({ length: 13, type: 'more' })((new Date()?.getFullYear() - new Date(date_of_birth)?.getFullYear())),
                email: await userSchema.findOne({ email: encrypt(email) }),
                usernameTag: await userSchema.findOne({ username: encrypt(username), tag }),
                usernameslength: lengthChecker({ length: 5000, type: 'more' })(await userSchema.countDocuments({ username: encrypt(username) })),
                invite: (invite ? await inviteSchema.findById(invite) : null),
                // Flags/Badges
                isBetaTester: (Math.random() < 0.05),
                userFlag: lengthChecker({ length: 1000, type: 'less' })(await userSchema.countDocuments()),
            };

            if (!checks.age || checks.agetwo || checks.email || checks.usernameslength) {
                res.status(403).send({
                    code: 403,
                    errors: [checks.age ? null : {
                        code: 'TOO_YOUNG',
                        message: 'The age provided is under 13. Kastel is a 13+ only application.',
            }, checks.email ? {
                        code: 'EMAIL_IN_USE',
                        message: 'The email that was provided is already in use.',
            } : null, checks.usernameslength ? {
                        code: 'MAX_USERNAMES',
                        message: `Max amount of '${username}' usernames`,
            } : null].filter((x) => x !== null),
                    responses: [],
                });

                return;
            }

            if (checks.usernameTag) {
                const userTags = (await userSchema.find({ username: encrypt(username) })).map((u) => u.tag);

                tag = tagGenerator(userTags);

                if (await userSchema.findOne({ username: encrypt(username), tag })) {
                    return res.status(500).send({
                        code: 500,
                        errors: [{
                            code: 'TRY_AGAIN',
                            message: 'Please try again',
                        }],
                        responses: [],
                    });
                }

                if (!tag) {
                    res.status(500).send({
                        code: 500,
                        errors: [{
                            code: 'NO_TAGS',
                            message: 'Sorry, No tags were able to be made for this username. Please try again.',
                        }],
                        responses: [],
                    });

                    return;
                }
            }

            const usr = new userSchema({
                _id: encrypt(_id),
                email: encrypt(email),
                username: encrypt(username),
                tag,
                password: await hash(password, 10),
                created_date: Date.now(),
                date_of_birth: encrypt(Number(new Date(date_of_birth))),
                ips: [encrypt(req.clientIp)],
                flags: FLAGS.BETA_TESTER,
                guilds: [],
                dms: [],
                groupChats: [],
            });

            if (checks.invite) {
                const guild = await guildSchema.findById(checks.invite.guild);

                if (guild) {
                    const member = await guildMemberSchema.create({
                        _id: generate(),
                        user: usr._id,
                        roles: [],
                    });

                    guild.members.push(member._id);
                    usr.guilds.push(guild._id);

                    await inviteSchema.findByIdAndUpdate(invite, {
                        $inc: {
                            uses: 1,
                        },
                    });

                    await guild.save();
                }
            }

            if (checks.userFlag) usr.badges = BADGES.ORIGINAL_USER;

            await usr.save();

            res.status(201).send({
                code: 201,
                errors: [],
                responses: [{
                    code: 'ACCOUNT_CREATED',
                    message: 'Account created.',
                }],
            });

        } catch (err) {
            important.error(`${req.clientIp} Encountered an error ${err.stack}`);

            if (!res.headersSent) {
                res.status(500).send({
                    code: 500,
                    errors: [{
                        code: 'ERROR',
                        message: 'There was an Error, Please contact Support.',
                     }],
                    responses: [],
                });

                return;
            }
        }
    },
);