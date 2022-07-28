/**
 Generates Unqiue IDs, Taken and Edited from the NPM package (discord-snowflake-id-js), No other sources found

 Creator Unknown, All Credits to them though, License Also Unknown
 */
class snowflake {
    /**
     * @param {Object} args
     * @param {Number} args.start
     * @param {BigInt} args.sequence
     * @param {BigInt} args.workerID
     * @param {BigInt} args.datacenterID
     * @param {BigInt} args.datacenterIDShift
     * @param {BigInt} args.timestampLeftShift
     * @param {BigInt} args.sequenceMask
     * @param {BigInt} args.timestamp
     * @param {Number} args.count
     */
    constructor(args) {
        this.epoch = this.hydrate(args.epoch, 1577836800000n)

        this.start = 0;

        this.count = 0;

        this.sequence = this.hydrate(args.sequence, 0n);

        this.workerID = (-1n ^ (-1n << this.hydrate(args.workerID_Bytes, 0n)));

        this.datacenterID = -1n ^ (-1n << this.hydrate(args.datacenterID_Bytes, 0n));

        this.workerIDShift = this.hydrate(args.sequence_Bytes, 0n);

        this.datacenterIDShift = this.workerIDShift + this.workerID;

        this.timestampLeftShift = this.workerIDShift + this.workerID + this.datacenterID;

        this.sequenceMask = -1n ^ (-1n << this.workerIDShift);

        this.timestamp = -1n;

        this.validate();
    }

    validate() {
        if (this.workerID > this.workerID || this.workerID < 0) throw new Error(`WorkerId can't be greater than ${this.workerID} or less than 0`);
        if (this.datacenterID > this.datacenterID || this.datacenterID < 0) throw new Error(`DatacenterID can't be greater than ${this.datacenterID} or less than 0`);
        this.start = Date.now();
    }

    /**
     * 
     * @param {BigInt|Number} args 
     * @param {BigInt|Number} Default 
     * @returns 
     */
    hydrate(args, Default) {
        if (typeof args !== "bigint") return BigInt(args);
        if (typeof args === "bigint") return BigInt(args);
        return BigInt(Default);
    }

    GenerateUUID() {
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
        if (timestamp < this.timestamp) throw new Error(`Clock moved backwards.`);
        if (this.timestamp === timestamp) {
            this.sequence = (this.sequence + 1n) & this.sequenceMask;
            if (this.sequence === 0n) {
                timestamp = localfunction(this.timestamp);
            }
        } else {
            this.sequence = 0n;
        }
        this.timestamp = timestamp;
        this.count++;
        return ((((timestamp - this.config_super.epoch) << this.timestampLeftShift) | (this.config_super.datacenterID << this.datacenterIDShift) | (this.config_super.workerID << this.workerIDShift) | this.sequence).toString());
    }
}

export default snowflake;