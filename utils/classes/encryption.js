const inviteGenerator = require("../inviteGenerator")
const crypto = require("crypto");

const algorithm = process.env.algorithm || "aes-256-cbc";
const initVector = process.env.initVector;
const securityKey = process.env.securityKey;

class encryption {
    /**
     * Encrypt Data 
     * @param {String} data 
     * @returns 
     */
    static encrypt(data) {
        try {
            const cipher = crypto.createCipheriv(algorithm, securityKey, initVector);

            const dd = {
                data,
                // secret: inviteGenerator(25)
            }

            return cipher.update(encryption.fixData(dd), "utf-8", "hex") + cipher.final("hex");
        } catch (er) {
            throw new Error(`Failed to encrypt\n${er}`)
        }
    }

    /**
     * Decrypt data
     * @param {String} data
     * @param {{ raw: boolean }} options 
     * @returns {String}
     */
    static decrypt(data, options = {
        raw: false
    }) {
        try {
            const decipher = crypto.createDecipheriv(algorithm, securityKey, initVector);
            const decrypted = decipher.update(data, "hex", "utf-8") + decipher.final("utf8");
            const cleaned = encryption.cleanData(decrypted);

            if (options.raw) return cleaned // also returns the secret
            else return cleaned.data;

        } catch (er) {
            throw new Error(`Failed to decrypt\n${er}`)
        }
    }

    /**
     * @private
     */
    static fixData(data) {
        if (typeof data == "object") data = JSON.stringify(data);

        if (typeof data == "number") data = String(data);

        if (typeof data == "undefined") data = "";

        if (typeof data !== "string") String(data);

        if (typeof data !== "string") throw new Error(`Failed to stringify data ${typeof data}, ${data}`)

        return data
    }

    /**
     * @private 
     */
    static cleanData(data) {
        try {
            const dd = JSON.parse(data);

            return dd
        } catch (e) {
            return data
        }
    }
}

module.exports = encryption