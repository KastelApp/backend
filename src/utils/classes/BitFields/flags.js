/*!
 * This source code is taken and edited from https://github.com/discordjs/discord.js
 * It is Licensed under the Apache License that can be found here http://www.apache.org/licenses/LICENSE-2.0  
 */

'use strict';
const { FLAGS } = require('../../../constants');
const BitField = require('./BitField');

/**
 * Data structure that makes it easy to interact with the Flags bitfields.
 * @extends {BitField}
 */
class UserFlags extends BitField {}

/**
 * @name UserFlags
 * @kind constructor
 * @memberof UserFlags
 * @param {BitFieldResolvable} [bits=0] Bit(s) to read from
 */

/**
 * Bitfield of the packed bits
 * @type {number}
 * @name UserFlags#bitfield
 */

/**
 * Numeric user flags. All available properties:
 * * `BETA_TESTER`
 * * `STAFF`
 * * `BOT`
 * * `VERIFIED_BOT`
 * * `SYSTEM`
 * * `GHOST`
 * * `SPAMMER`
 * * `BROKE_TOS`
 * * `CREATING_GUILDS_BAN`
 * * `ADDING_FRIENDS_BAN`
 * * `CREATING_GROUP_CHATS_BAN`
 * @type {Object}
 */
UserFlags.BITFIELDS = FLAGS;

module.exports = UserFlags;