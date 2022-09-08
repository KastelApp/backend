/*!
 * This source code is taken and edited from https://github.com/discordjs/discord.js
 * It is Licensed under the Apache License that can be found here http://www.apache.org/licenses/LICENSE-2.0  
 */

// ToDo, Finish Fixing JSDocs

/**
 * This is just some static functions from The BitField class
 */
class Bits {
    /**
     * Data that can be resolved to give a bitfield. This can be:
     * * A bit number (this can be a number literal or a value taken from a provided object)
     * * A string bit number
     * * An Array of BitFieldResolvable
     * @typedef {number|string|bigint|(number|string|bigint)[]} BitFieldResolvable
     */

    /**
     * Adds bits to these ones.
     * @param {Object} bitfields The Bitfield Object
     * @param {currentBits} [currentBits=0] The Current bits to add to
     * @param {...BitFieldResolvable} [bits] Bits to add
     * @returns {BitFieldResolvable} These bits
     */
    static add(bitfields, currentBits = 0, ...bits) {
        let total = 0;

        for (const bit of bits) {
            total |= Bits.resolve(bitfields, bit);
        }

        return currentBits |= total;
    }

    /**
     * Removes bits from these.
     * @param {Object} bitfields The Bitfield Object
     * @param {currentBits} [currentBits=0] The Current bits to remove from
     * @param {...BitFieldResolvable} [bits] Bits to remove
     * @returns {BitFieldResolvable} These bits or new BitField if the instance is frozen.
     */
    static remove(bitfields, currentBits = 0, ...bits) {
        let total = 0;

        for (const bit of bits) {
            total |= Bits.resolve(bitfields, bit);
        }

        return currentBits & ~total;
    }

    /**
     * Gets an object mapping field names to a {@link boolean} indicating whether the
     * bit is available.
     * @returns {Object}
     */
    static serialize(bitfields, bits) {
        const serialized = {};

        for (const [flag, bit] of Object.entries(bitfields)) serialized[flag] = Bits.has(bitfields, bits, bit);

        return serialized;
    }

    /**
     * Checks whether the bitfield has a bit, or multiple Bits.
     * @param {BitFieldResolvable} bit Bit(s) to check for
     * @returns {boolean}
     */
    static has(bitfields, bits, bit) {
        bit = Bits.resolve(bitfields, bit);
        return (bits & bit) === bit;
    }

    /**
     * Gets an {@link Array} of bitfield names based on the bits available.
     * @returns {string[]}
     */
    static toArray(bitfields, bits) {
        return Object.keys(bitfields).filter(bit => Bits.has(bitfields, bits, bit));
    }

    /**
     * Resolves bitfields to their numeric form.
     * @param {BitFieldResolvable} [bit] bit(s) to resolve
     * @returns {BitFieldResolvable}
     */
    static resolve(bitfields, bit) {
        const defaultBit = 0;

        if (typeof defaultBit === typeof bit && bit >= defaultBit) return bit;

        if (Array.isArray(bit)) return bit.map(p => Bits.resolve(p)).reduce((prev, p) => prev | p, defaultBit);

        if (typeof bit === 'string') {
            if (typeof bitfields[bit] !== 'undefined') return bitfields[bit];
            if (!isNaN(bit)) return typeof defaultBit === 'bigint' ? BigInt(bit) : Number(bit);
        }

        throw new Error(`BITFIELD_INVALID: ${bit}`);
    }
}

module.exports = Bits