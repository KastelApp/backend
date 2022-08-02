const { generateId } = require("../../../utils/idGen")
const banSchema = require("../../../utils/schemas/guilds/banSchema")
const channelSchema = require("../../../utils/schemas/guilds/channelSchema")
const guildMemberSchema = require("../../../utils/schemas/guilds/guildMemberSchema")
const guildSchema = require("../../../utils/schemas/guilds/guildSchema")
const inviteSchema = require("../../../utils/schemas/guilds/inviteSchema")
const roleSchema = require("../../../utils/schemas/guilds/roleSchema")
const webhookSchema = require("../../../utils/schemas/guilds/webhookSchema")
const fileSchema = require("../../../utils/schemas/important/fileSchema")
const messageSchema = require("../../../utils/schemas/important/messageSchema")
const dmSchema = require("../../../utils/schemas/privateMessages/dmSchema")
const groupchatSchema = require("../../../utils/schemas/privateMessages/groupchatSchema")
const badgeSchema = require("../../../utils/schemas/users/badgeSchema")
const friendSchema = require("../../../utils/schemas/users/friendSchema")
const giftSchema = require("../../../utils/schemas/users/giftSchema")
const userSchema = require("../../../utils/schemas/users/userSchema")

module.exports = {
    path: "/data",
    method: "get",
    middleWare: [],
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     */
    run: async (req, res, next) => {
        const user = await userSchema.create({
            _id: generateId(),
            email: "darkerink@kastelapp.org",
            username: "Lilith",
            tag: "1750",
            password

        })
    },
}