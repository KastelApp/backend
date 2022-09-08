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
    MAX_GUILD_COUNT: 50,
    MAX_FRIEND_COUNT: 100,
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
    ALL: 480,
};

module.exports.GUILD_FLAGS = {
    VERIFIED: 1 << 0,
    PARTNERED: 1 << 1,
    PUBLIC: 1 << 2,
};

module.exports.CHANNEL_TYPES = {
    'GUILD_CATEGORY': 1,
    'GUILD_TEXT': 2,
    'GUILD_NEWS': 3,
    'GUILD_RULES': 4,
    'GUILD_VOICE': 5,
    // Guild Admins can create a "New Member Channel".
    // This channel will be shown to the user for as long as the Admins set.
    // It acts like a normal channel but only new members & users with MANAGE_CHANNELS can see it
    'GUILD_NEW_MEMBER': 6,
    'DM': 10,
    'GROUP_CHAT': 11,
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

module.exports.version = require('../package.json').version;