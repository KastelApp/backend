const { generateId } = require("../../../utils/idGen")
const inviteGnerator = require("../../../utils/inviteGenerator")
const userSchema = require("../../../utils/schemas/users/userSchema")
const badgeSchema = require("../../../utils/schemas/users/badgeSchema")
const friendSchema = require("../../../utils/schemas/users/friendSchema")
const giftSchema = require("../../../utils/schemas/users/giftSchema")
const banSchema = require("../../../utils/schemas/guilds/banSchema")
const channelSchema = require("../../../utils/schemas/guilds/channelSchema")
const guildMemberSchema = require("../../../utils/schemas/guilds/guildMemberSchema")
const guildSchema = require("../../../utils/schemas/guilds/guildSchema")
const inviteSchema = require("../../../utils/schemas/guilds/inviteSchema")
const roleSchema = require("../../../utils/schemas/guilds/roleSchema")
const webhookSchema = require("../../../utils/schemas/guilds/webhookSchema")
const dmSchema = require("../../../utils/schemas/privateMessages/dmSchema")
const groupchatSchema = require("../../../utils/schemas/privateMessages/groupchatSchema")
const fileSchema = require("../../../utils/schemas/misc/fileSchema")
const messageSchema = require("../../../utils/schemas/misc/messageSchema")

module.exports = {
    path: "/test",
    method: "get",
    middleWare: [],
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     */
    run: async (req, res, next) => {
        // const test = new guildSchema({
        //     _id: generateId(),
        //     name: "Epic Guild no cap",
        //     description: "Its a epic guild so JOIN NOW",
        //     public: true,
        //     verified: true,
        //     owner: "306681700073603072",
        //     members: [],
        //     channels: [],
        //     roles: []
        // })

        // const member = await guildMemberSchema.create({
        //     _id: generateId(),
        //     user: "306681700073603072",
        //     roles: []
        // })

        // const role = await roleSchema.create({
        //     _id: test._id,
        //     name: "everyone",
        //     deleteable: false,
        //     allowed_mentions: ["users"]
        // })

        // const channel = await channelSchema.create({
        //     _id: generateId(),
        //     name: "chat",
        //     description: "Chat with a friend",
        //     type: 1
        // })

        // const invite = await inviteSchema.create({
        //     _id: inviteGnerator(),
        //     guild: test._id,
        //     creator: "306681700073603072"
        // })

        // test.members.push(member._id)
        // test.channels.push(channel._id)
        // test.roles.push(role._id)
        // test.invites.push(invite._id)

        // await test.save()

        // res.send(test)

        const invite = await inviteSchema.findById("xwqGga6WemV7RNT").populate("guild").populate("creator")

        console.log(invite)

        res.send(invite)
    },
}