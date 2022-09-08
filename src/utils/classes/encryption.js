/*! 
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║     
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

const crypto = require("crypto");
const { Encryption } = require("../../config");

const algorithm = Encryption.algorithm || "aes-256-cbc";
const initVector = Encryption.initVector;
const securityKey = Encryption.securityKey;

class encryption {
    /**
     * Encrypt Data 
     * @param {String} data The String to encrypt 
     * @returns {String} The encrypted string
     */
    static encrypt(data) {
        try {
            const cipher = crypto.createCipheriv(algorithm, securityKey, initVector);

            const dd = {
                data
            }

            return cipher.update(encryption.fixData(dd), "utf-8", "hex") + cipher.final("hex");
        } catch (er) {
            throw new Error(`Failed to encrypt\n${er}`)
        }
    }

    /**
     * Decrypt data
     * @param {String} data
     * @returns {*} the decrypted data
     */
    static decrypt(data, raw = false) {
        try {
            const decipher = crypto.createDecipheriv(algorithm, securityKey, initVector);
            const decrypted = decipher.update(data, "hex", "utf-8") + decipher.final("utf8");
            const cleaned = encryption.cleanData(decrypted)

            if (raw) return cleaned

            return cleaned.data
        } catch (er) {
            throw new Error(`Failed to decrypt (${er.message})`)
        }
    }

    /**
     * Checks if a string is encrypted or not
     * @param {String} item 
     * @returns {Boolean} If the string is encrypted or not
     */
    static isEncrypted(item) {
        try {
            encryption.decrypt(item)

            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * @private
     */
    static fixData(data) {
        if (typeof data == "object") data = JSON.stringify(data);

        if (typeof data == "undefined") data = "";

        if (typeof data !== "string") data = String(data);

        if (typeof data !== "string") throw new Error(`Failed to stringify data ${typeof data}, ${data}`)

        return data;
    }

    /**
     * @private 
     */
    static cleanData(data) {
        try {
            const dd = JSON.parse(data);

            return dd;
        } catch (e) {
            return data;
        }
    }

    /**
     * @param {*} items
     * @return {items} 
     */
    static completeDecryption(items, raw = false) {
        const decrypt = (item) => encryption.decrypt(item, raw);
        const completeDecrypt = (item) => encryption.completeDecryption(item, raw);
        const isEncrypted = encryption.isEncrypted;

        if (typeof items == "string") {
            return decrypt(items);
        };

        if (typeof items == "object") {
            if (Array.isArray(items)) {
                let newArray = []
                for (let item of items) {
                    if (typeof item == "function") continue; // Nothing currently requires a decryption with a function in it

                    if (isEncrypted(item)) newArray.push(decrypt(item));
                    else if (typeof item == "object" && !(items[item] instanceof Date)) {
                        newArray.push(completeDecrypt(item));
                    } else newArray.push(item);
                }

                return newArray;
            } else {
                let newObject = {};

                for (const item in items) {
                    if (typeof items[item] == "function") continue; // Nothing currently requires a decryption with a function in it

                    if (isEncrypted(items[item])) newObject[item] = decrypt(items[item]);
                    else if (typeof items[item] == "object" && !(items[item] instanceof Date)) {
                        newObject[item] = completeDecrypt(items[item])
                    } else newObject[item] = items[item]
                }

                return newObject;
            }
        }
    }

    /**
     * @param {*} items
     * @return {items} 
     */
    static completeEncryption(items) {
        const encrypt = encryption.encrypt;
        const completeEncrypt = encryption.completeEncryption;
        const isEncrypted = encryption.isEncrypted;

        if (typeof items == "string") {
            return encrypt(items);
        };

        if (typeof items == "object") {
            if (items instanceof Array) {
                let newArray = []
                for (let item of items) {
                    if (typeof item == "function") continue; // Nothing currently requires a decryption with a function in it

                    if (!isEncrypted(item)) newArray.push(encrypt(item));
                    else if (typeof item == "object" && !(items[item] instanceof Date)) {
                        newArray.push(completeEncrypt(item));
                    } else newArray.push(item);
                }

                return newArray;
            } else {
                let newObject = {};

                for (const item in items) {
                    if (typeof items[item] == "function") continue; // Nothing currently requires a decryption with a function in it

                    if (!isEncrypted(items[item])) newObject[item] = encrypt(items[item]);
                    else if (typeof items[item] == "object" && !(items[item] instanceof Date)) {
                        newObject[item] = completeEncrypt(items[item])
                    } else newObject[item] = items[item]
                }

                return newObject;
            }
        }
    }
}

module.exports = encryption