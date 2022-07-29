/**
 Generates Unqiue Ids, Taken and Edited from the NPM package (discord-snowflake-id-js), No other sources found

 Creator Unknown, All Credits to them though, License Also Unknown
 */
 class snowflakeIdGenerator {
    /**
     * @param {Object} args
     * @param {Number} args.start
     * @param {BigInt} args.sequence
     * @param {BigInt} args.workerId
     * @param {BigInt} args.datacenterId
     * @param {BigInt} args.datacenterIdShift
     * @param {BigInt} args.timestampLeftShift
     * @param {BigInt} args.sequenceMask
     * @param {BigInt} args.timestamp
     * @param {Number} args.count
     */
    static setup(args = {
        epoch: 1658536392598,
        workerID: 0,
        datacenterID: 0,
        workerID_Bytes: 5,
        datacenterID_Bytes: 5,
        sequence: 0,
        sequence_Bytes: 12,
    }) {

        snowflakeIdGenerator.config = {
            workerId: snowflakeIdGenerator.hydrate(args.workerId, 0n),
            datacenterId: snowflakeIdGenerator.hydrate(args.datacenterId, 0n),
            workerId_Bytes: snowflakeIdGenerator.hydrate(args.workerId_Bytes, 0n),
            datacenterId_Bytes: snowflakeIdGenerator.hydrate(args.datacenterId_Bytes, 0n),
            sequence: snowflakeIdGenerator.hydrate(args.sequence, 0n),
            sequence_Bytes: snowflakeIdGenerator.hydrate(args.sequence_Bytes, 0n),
        }

        snowflakeIdGenerator.epoch = snowflakeIdGenerator.hydrate(args.epoch, 1658536392598n)

        snowflakeIdGenerator.start = 0;

        snowflakeIdGenerator.count = 0;

        snowflakeIdGenerator.sequence = snowflakeIdGenerator.config.sequence;

        snowflakeIdGenerator.workerId = -1n ^ (-1n << snowflakeIdGenerator.config.workerId_Bytes);

        snowflakeIdGenerator.datacenterId = -1n ^ (-1n << snowflakeIdGenerator.config.datacenterId_Bytes);

        snowflakeIdGenerator.workerIdShift = snowflakeIdGenerator.config.sequence_Bytes;

        snowflakeIdGenerator.datacenterIdShift = snowflakeIdGenerator.config.sequence_Bytes + snowflakeIdGenerator.config.workerId_Bytes;

        snowflakeIdGenerator.timestampLeftShift = snowflakeIdGenerator.config.sequence_Bytes + snowflakeIdGenerator.config.workerId_Bytes + snowflakeIdGenerator.config.datacenterId_Bytes;

        snowflakeIdGenerator.sequenceMask = -1n ^ (-1n << snowflakeIdGenerator.config.sequence_Bytes);

        snowflakeIdGenerator.timestamp = -1n;

        snowflakeIdGenerator.isSetup = true

        snowflakeIdGenerator.validate();
    }

    /**
     * @private
     */
    static validate() {
        if (snowflakeIdGenerator.workerId > snowflakeIdGenerator.workerId || snowflakeIdGenerator.workerId < 0) throw new Error(`WorkerId can't be greater than ${snowflakeIdGenerator.workerId} or less than 0`);

        if (snowflakeIdGenerator.datacenterId > snowflakeIdGenerator.datacenterId || snowflakeIdGenerator.datacenterId < 0) throw new Error(`DatacenterId can't be greater than ${snowflakeIdGenerator.datacenterId} or less than 0`);

        snowflakeIdGenerator.start = Date.now();
    }

    /**
     * @private
     * @param {BigInt|Number} args 
     * @param {BigInt|Number} Default 
     * @returns 
     */
    static hydrate(args, Default) {

        if (!args) return BigInt(Default);

        if (typeof args !== "bigint") return BigInt(args);

        if (typeof args === "bigint") return BigInt(args);

        return BigInt(Default);
    }

    /**
     * Generate a Id
     * @returns {BigInt}
     */
    static generateId() {

        if (!snowflakeIdGenerator.isSetup) throw new Error("Please call snowflakeIdGenerator.setup first")

        /**
         * @param {BigInt} arg 
         * @returns {Date}
         */
        const localfunction = (arg) => {
            let timestamp = BigInt(Date.now());

            while (timestamp <= arg) {
                timestamp = BigInt(Date.now());
            }

            return timestamp;
        }

        let timestamp = BigInt(Date.now());

        if (timestamp < snowflakeIdGenerator.timestamp) throw new Error(`Clock moved backwards.`);

        if (snowflakeIdGenerator.timestamp === timestamp) {
            snowflakeIdGenerator.sequence = ((snowflakeIdGenerator.sequence + 1n) & snowflakeIdGenerator.sequenceMask);

            if (snowflakeIdGenerator.sequence === 0n) {
                timestamp = localfunction(snowflakeIdGenerator.timestamp);
            }
        } else {
            snowflakeIdGenerator.sequence = 0n;
        }

        snowflakeIdGenerator.timestamp = timestamp;

        snowflakeIdGenerator.count++;
        return ((((timestamp - snowflakeIdGenerator.epoch) << snowflakeIdGenerator.timestampLeftShift) | (snowflakeIdGenerator.config.datacenterId << snowflakeIdGenerator.datacenterIdShift) | (snowflakeIdGenerator.config.workerId << snowflakeIdGenerator.workerIdShift) | snowflakeIdGenerator.sequence).toString());
    }
}

module.exports = snowflakeIdGenerator