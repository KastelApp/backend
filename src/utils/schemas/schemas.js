const banSchema = require('./guilds/banSchema');
const channelSchema = require('./guilds/channelSchema');
const guildMemberSchema = require('./guilds/guildMemberSchema');
const guildSchema = require('./guilds/guildSchema');
const inviteSchema = require('./guilds/inviteSchema');
const roleSchema = require('./guilds/roleSchema');
const webhookSchema = require('./guilds/webhookSchema');
const fileSchema = require('./misc/fileSchema');
const messageSchema = require('./misc/messageSchema');
const dmSchema = require('./privateMessages/dmSchema');
const groupchatSchema = require('./privateMessages/groupchatSchema');
const friendSchema = require('./users/friendSchema');
const giftSchema = require('./users/giftSchema');
const userSchema = require('./users/userSchema');

module.exports = {
    banSchema,
    channelSchema,
    guildMemberSchema,
    guildSchema,
    inviteSchema,
    roleSchema,
    webhookSchema,
    fileSchema,
    messageSchema,
    dmSchema,
    groupchatSchema,
    friendSchema,
    giftSchema,
    userSchema,
};