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

const jwt = require('jsonwebtoken');
const { Encryption } = require('../../config');

/**
 * @typedef {Object} SignedObject
 * @property {Boolean} hasError If there was a error while signing/verifying
 * @property {Error} error The error if there is one
 * @property {*} data The signed jwt token
 */

class token {
    /**
     * Create a token
     * @param {String} data
     * @returns {SignedObject}
     */
    static sign(data, options = {
        expiresIn: '7d',
    }) {
        try {

            if (!data) {
                return {
                    hasError: false,
                    error: null,
                    data: null,
                };
            }

            const signed = jwt.sign(data, Encryption.jwtKey, { ...options });

            return {
                hasError: false,
                error: null,
                data: signed,
            };
        } catch (e) {
            return {
                hasError: true,
                error: e,
                data: null,
            };
        }
    }

    /**
     * Verify and return a token
     * @param {String} data
     * @returns {SignedObject}
     */
    static verify(data, options) {
        try {

            if (!data) {
                return {
                    hasError: false,
                    error: null,
                    data: null,
                };
            }

            const verified = jwt.verify(data, Encryption.jwtKey, { ...options });

            return {
                hasError: false,
                error: null,
                data: verified,
            };
        } catch (e) {
            return {
                hasError: true,
                error: e,
                data: null,
            };
        }
    }
}

module.exports = token;