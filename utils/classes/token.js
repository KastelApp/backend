const jwt = require('jsonwebtoken');
const ms = require("ms");

class token {
    /**
     * Create a token
     * @param {String} data 
     * @returns 
     */
    static sign(data, options = {
        expiresIn: "7d"
    }) {
        try {

            if (!data) return {
                hasError: false,
                error: null,
                data: null
            }

            const signed = jwt.sign(data, process.env.jwtKey, { ...options })

            return {
                hasError: false,
                error: null,
                data: signed
            }
        } catch (e) {
            return {
                hasError: true,
                error: e,
                data: null
            }
        }
    }

    static verify(data, options) {
        try {

            if (!data) return {
                hasError: false,
                error: null,
                data: null
            }

            const verified = jwt.verify(data, process.env.jwtKey, { ...options })

            return {
                hasError: false,
                error: null,
                data: verified
            }
        } catch (e) {
            return {
                hasError: true,
                error: e,
                data: null
            }
        }
    }
}

module.exports = token