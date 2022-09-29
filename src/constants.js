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


module.exports.SETTINGS = {
    MAX: {
        GUILD_COUNT: 50,
        CHANNEL_COUNT: 250,
        ROLE_COUNT: 250,
        INVITE_COUNT: 500,
        BAN_COUNT: Infinity,
        FRIEND_COUNT: 100,
        OG_BADGES: 1000,
        MEMBER_COUNT: 500,
    },
    // The chance the user has to get the beta flag on signup
    BETA_FLAG: 0.05,
};

module.exports.BADGES = {
    GHOST: 1 << 0,
    SPONSOR: 1 << 1,
    STAFF: 1 << 2,
    DEVELOPER: 1 << 3,
    VERIFIED_BOT_DEVELOPER: 1 << 4,
    ORIGINAL_USER: 1 << 5,
    PARTNER: 1 << 6,
    MODERATOR: 1 << 7,
    MINOR_BUG_HUNTER: 1 << 8,
    MAJOR_BUG_HUNTER: 1 << 9,
};

module.exports.ALLOWED_MENTIONS = {
    EVERYONE: 1 << 5,
    HERE: 1 << 6,
    ROLES: 1 << 7,
    USERS: 1 << 8,
};

module.exports.GUILD_FLAGS = {
    VERIFIED: 1 << 0,
    PARTNERED: 1 << 1,
    OFFICIAL: 1 << 2,
    NO_OWNER: 1 << 10,
};

module.exports.CHANNEL_TYPES = {
    GUILD_CATEGORY: 1,
    GUILD_TEXT: 2,
    GUILD_NEWS: 3,
    GUILD_RULES: 4,
    GUILD_VOICE: 5,
    GUILD_NEW_MEMBER: 6,
    DM: 10,
    GROUP_CHAT: 11,
};

module.exports.PRESENCE = {
    ONLINE: 1,
    IDLE: 2,
    DND: 3,
    OFFLINE: 4,
};

// Unlike badges flags will actually let you do more stuff or restirct you for doing stuff
module.exports.FLAGS = {
    GHOST: 1 << 0,
    SYSTEM: 1 << 1,
    STAFF: 1 << 2,
    BETA_TESTER: 1 << 3,
    BOT: 1 << 4,
    VERIFIED_BOT: 1 << 5,
    SPAMMER: 1 << 10,
    TOS: 1 << 11,
    GUILD_BAN: 1 << 12,
    FRIEND_BAN: 1 << 13,
    GROUPCHAT_BAN: 1 << 14,
};

// These are BigInts since BigInt Bitfields don't loop around to One after 32 (1 << 32 loops 1 but 1n << 32n goes to 4294967296n)
module.exports.PERMISSIONS = {
    ADMINISTRATOR: 1n << 0n,
    MANAGE_GUILD: 1n << 1n,
    MANAGE_ROLES: 1n << 2n,
    MANAGE_CHANNELS: 1n << 3n,
    MANAGE_MEMBERS: 1n << 4n,
    MANAGE_EMOJIS: 1n << 5n,
    MANAGE_BANS: 1n << 6n,
    MANAGE_NICKNAMES: 1n << 7n,
    MANAGE_INVITES: 1n << 8n,
    MANAGE_MESSAGES: 1n << 9n,
    SEND_MESSAGES: 1n << 10n,
    READ_MESSAGES: 1n << 11n,
    KICK_MEMBERS: 1n << 12n,
    BAN_MEMBERS: 1n << 13n,
    CREATE_INVITES: 1n << 14n,
    VIEW_CHANNEL: 1n << 15n,
    BYPASS_SLOWMODE: 1n << 16n,
    MANAGE_CHANNEL: 1n << 17n,
    CHANGE_NICKNAME: 1n << 18n,
    MANAGE_WEBHOOKS: 1n << 19n,
    VIEW_AUDIT_LOG: 1n << 20n,
};

module.exports.RELATIONSHIP_TYPES = {
    FRIEND: 1,
    BLOCKED: 2,
    INCOMING_FRIEND_REQUEST: 3,
    OUTGOING_FRIEND_REQUEST: 4,
};

module.exports.RELATIONSHIP_FLAGS = {
    MATUAL_FRIEND: 1 << 0,
};

module.exports.AUDIT_LOG_ACTIONS = {

};

this.BADGES.ALL = Object.values(this.BADGES).reduce((a, p) => a | p, 0);
this.ALLOWED_MENTIONS.ALL = Object.values(this.ALLOWED_MENTIONS).reduce((a, p) => a | p, 0);
this.GUILD_FLAGS.ALL = Object.values(this.GUILD_FLAGS).reduce((a, p) => a | p, 0);
this.FLAGS.ALL = Object.values(this.FLAGS).reduce((a, p) => a | p, 0);
this.PERMISSIONS.ALL = Object.values(this.PERMISSIONS).reduce((a, p) => a | p, 0n);

module.exports.version = require('../package.json').version;