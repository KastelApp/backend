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

const { Snowflake: snow } = require('../../config');

/**
 * @typedef {Object} SnowflakeSettings
 * @property {BigInt} epoch The Time of date the IDs will generate from,
 * @property {BigInt} start The time the Snowflakes started generating from
 * @property {Number} increment The current increment of ids generating are at (Reverts to 0 at 4095)
 * @property {BigInt} workerId
 * @property {BigInt} sequenceMask
 * @property {BigInt} datacenterId
 * @property {BigInt} workerShift
 * @property {BigInt} dataCenterShift
 * @property {BigInt} timeShift
 */

/**
 * @type {SnowflakeSettings}
 */
const settings = {
    epoch: BigInt(new Date(Number((snow.epoch || 1641016800000))).getTime()),
    start: BigInt(Date.now()),
    increment: 0,
    workerId: (-1n ^ (-1n << BigInt((snow.workerId_Bytes || 6)))),
    sequenceMask: (-1n ^ (-1n << BigInt((snow.sequence_Bytes || 15)))),
    datacenterId: (-1n ^ (-1n << BigInt((snow.datacenterId_Bytes || 7)))),
    workerShift: BigInt((snow.sequence_Bytes || 15)),
    dataCenterShift: (BigInt((snow.sequence_Bytes || 15)) + BigInt((snow.workerId_Bytes || 6))),
    timeShift: (BigInt((snow.sequence_Bytes || 15)) + BigInt((snow.workerId_Bytes || 6)) + BigInt((snow.datacenterId_Bytes || 7))),
};

// Some Ideas are taken from the NPM Package Discord.js

class Snowflake {
    /**
     * Generates a Single Snowflake ID
     * @see {@link Snowflake.massGenerate Mass Generate} to generate more then one snowflake at once
     * @param {Number|Date} [timestamp=Date.now()] A Date or Number for the snowflake to generate from
     * @returns {String} The Snowflake ID
     */
    static generate(timestamp = Date.now()) {
        if (typeof timestamp !== 'number' || isNaN(timestamp)) { throw new TypeError(`'timestamp' expected to be number but got ${isNaN(timestamp) ? 'NaN' : typeof timestamp}`); }


        timestamp = BigInt(timestamp);

        if (settings.increment >= 4095) settings.increment = 0;

        return ((BigInt(timestamp - settings.epoch) << settings.timeShift) | ((BigInt((snow.datacenterId || 0)) << settings.dataCenterShift) | (BigInt((snow.workerId || 1)) << settings.workerShift)) | BigInt(settings.increment++)).toString();
    }

    /**
     * Generates a {@link Array} of Snowflake IDs
     * @see {@link Snowflake.generate SnowFlake Generator}
     * @param {Number} [amount=5] The amount of Ids you want to generate
     * @returns {string[]} The Ids
     */
    static massGenerate(amount = 5) {
        if (typeof amount !== 'number' || isNaN(amount)) { throw new TypeError(`'amount' expected to be number but got ${isNaN(amount) ? 'NaN' : typeof amount}`); }


        const ids = [];

        for (let i = 0; i < amount; i++) {
            ids.push(Snowflake.generate());
        }

        return ids;
    }

    /**
     * @returns {SnowflakeSettings} The Generators Settings
     * @readonly
     */
    static get settings() {
        return settings;
    }

    /**
     * Retrieves the timestamp field's value from a snowflake.
     * @param {String} snowflake Snowflake to get the timestamp value from
     * @returns {number} The Date
     */
    static timeStamp(snowflake) {
        return (Number((BigInt(snowflake) >> settings.timeShift) + settings.epoch));
    }
}

module.exports = Snowflake;