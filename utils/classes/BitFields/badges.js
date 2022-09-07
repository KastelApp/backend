/*!
 * This source code is taken and edited from https://github.com/discordjs/discord.js
 * It is Licensed under the Apache License that can be found here http://www.apache.org/licenses/LICENSE-2.0  
 */

'use strict';
const { BADGES } = require('../../../constants');
const BitField = require('./BitField');

/**
 * Data structure that makes it easy to interact with the Badges bitfields.
 * @extends {BitField}
 */
class UserBadges extends BitField {}

/**
 * @name UserBadges
 * @kind constructor
 * @memberof UserBadges
 * @param {BitFieldResolvable} [bits=0] Bit(s) to read from
 */

/**
 * Bitfield of the packed bits
 * @type {number}
 * @name UserBadges#bitfield
 */

/**
 * Numeric user badges. All available properties:
 * * `GHOST`
 * * `SPONSOR`
 * * `STAFF`
 * * `DEVELOPER`
 * * `VERIFIED_BOT_DEVELOPER`
 * * `ORIGINAL_USER`
 * * `PARTNER`
 * * `MODERATOR`
 * * `MINOR_BUG_HUNTER`
 * * `MAJOR_BUG_HUNTER`
 * @type {Object}
 */
UserBadges.BITFIELDS = BADGES;

module.exports = UserBadges;