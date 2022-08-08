const { default: mongoose } = require("mongoose")
const { generateId } = require("../../../utils/idGen")
const lengthChecker = require("../../../utils/lengthChecker")
const guildSchema = require("../../../utils/schemas/guilds/guildSchema")
const inviteSchema = require("../../../utils/schemas/guilds/inviteSchema")
const userSchema = require("../../../utils/schemas/users/userSchema")
const badgeSchema = require("../../../utils/schemas/users/badgeSchema")
const guildMemberSchema = require("../../../utils/schemas/guilds/guildMemberSchema")
const { hash } = require('bcrypt');
const { BADGES, FLAGS } = require("../../../config")
const tagGenerator = require("../../../utils/tagGenerator")

// This is a testing endpoint as of now. Code here can and will be completely changed.
module.exports = {
    path: "/register",
    method: "post",
    middleWare: [],
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     */
    run: async (req, res) => {

        try {

            /**
             * @type {{username: String, email: String, password: String, date_of_birth: Date, invite: String}} 
             */
            const { username, email, password, date_of_birth, invite } = req?.body

            if (!username || !email || !password || !date_of_birth || (new Date(date_of_birth) == "Invalid Date")) {
                res.status(400).send({
                    code: 400,
                    errors: [!username ? {
                        code: "MISSING_USERNAME",
                        message: "No username provided"
                } : null, !email ? {
                        code: "MISSING_EMAIL",
                        message: "No email provided."
                } : null, !password ? {
                        code: "MISSING_PASSWORD",
                        message: "No Password provided"
                } : null, !date_of_birth ? {
                        code: "MISSING_DATE_OF_BIRTH",
                        message: "No Date of birth provided"
         } : new Date(date_of_birth) == "Invalid Date" ? {
                        code: "INVALID_DATE_OF_BIRTH",
                        message: "The provided Date of Birth is Invalid"
            } : null].filter((x) => x !== null)
                })

                return;
            }

            const _id = generateId();
            let tag = _id.slice((_id.length - 4)) == "0000" ? "0001" : _id.slice((_id.length - 4))

            const checks = {
                age: lengthChecker({ length: 13, type: "more" })((new Date()?.getFullYear() - new Date(date_of_birth)?.getFullYear())),
                email: await userSchema.findOne({ email }),
                usernameTag: await userSchema.findOne({ username, tag }),
                usernameslength: lengthChecker({ length: 9999, type: "more" })(await userSchema.countDocuments({ username })),
                invite: invite ? await inviteSchema.findById(invite) : null,
                // Flags/Badges
                isBetaTester: (Math.random() < 0.05),
                userFlag: lengthChecker({ length: 1000, type: "less" })(await userSchema.countDocuments())
            }

            if (!checks.age || checks.agetwo || checks.email || checks.usernameslength) {
                res.status(403).send({
                    code: 403,
                    errors: [checks.age ? null : {
                        code: "TOO_YOUNG",
                        message: "The age provided is under 13. Kastel is a 13+ only application."
                }, checks.email ? {
                        code: "EMAIL_IN_USE",
                        message: "The email that was provided is already in use."
                } : null, checks.usernameslength ? {
                        code: "MAX_USERNAMES",
                        message: `Max amount of '${username}' usernames`
                } : null].filter((x) => x !== null)
                })

                return;
            }

            if (checks.usernameTag) {
                const userTags = (await userSchema.find({ username })).map((user) => user.tag);
                tag = tagGenerator(userTags)

                if (!tag) return res.status(500).send({
                    code: 500,
                    errors: [{
                        code: "NO_TAGS",
                        message: "Sorry, No tags were able to be made for this username. Please try again."
                    }]
                })
            }

            const usr = new userSchema({
                _id,
                email,
                username,
                tag,
                password: await hash(password, 10),
                created_date: Date.now(),
                date_of_birth: Number(new Date(date_of_birth)),
                ips: [req.clientIp],
                flags: [checks.isBetaTester ? FLAGS.BETA_TESTER : null].filter((x) => x !== null),
                guilds: [],
                dms: [],
                groupChats: []
            })

            if (checks.invite) {
                const guild = await guildSchema.findById(checks.invite.guild);

                if (guild) {
                    const member = await guildMemberSchema.create({
                        _id: generateId(),
                        user: usr._id,
                        roles: []
                    })

                    guild.members.push(member._id);
                    usr.guilds.push(guild._id);

                    await inviteSchema.findByIdAndUpdate(invite, {
                        $inc: {
                            uses: 1
                        }
                    })
                    await guild.save()
                }
            }

            await usr.save();

            if (checks.userFlag) await badgeSchema.create({
                user: usr._id,
                ...BADGES.ORIGINAL_USER
            })


            res.status(201).send(usr);

        } catch (error) {
            logger.error(`${req.clientIp} Encountered an error ${error.stack}`)
            res.status(500).send({
                code: 500,
                errors: [{
                    code: "UNHANDLED_ERROR",
                    message: "There was a Unhandled error, Please report this."
                }]
            })
        }
    },
}