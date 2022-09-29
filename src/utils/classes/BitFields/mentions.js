/* !
 * This source code is taken and edited from https://github.com/discordjs/discord.js
 * It is Licensed under the Apache License that can be found here http://www.apache.org/licenses/LICENSE-2.0
 */

'use strict';
const { ALLOWED_MENTIONS } = require('../../../constants');
const BitField = require('./BitField');

/**
 * Data structure that makes it easy to interact with the Allowed Mentions bitfields.
 * @extends {BitField}
 */
class AllowedMentions extends BitField {}

/**
 * @name AllowedMentions
 * @kind constructor
 * @memberof AllowedMentions
 * @param {BitFieldResolvable} [bits=0] Bit(s) to read from
 */

/**
 * Bitfield of the packed bits
 * @type {number}
 * @name AllowedMentions#bitfield
 */

/**
 * Numeric allowed mentions. All available properties:
 * * `EVERYONE`
 * * `HERE`
 * * `ROLES`
 * * `USERS`
 * @type {Object}
 */
AllowedMentions.BITFIELDS = ALLOWED_MENTIONS;

module.exports = AllowedMentions;