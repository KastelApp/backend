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

import jwt from 'jsonwebtoken';
import { Encryption } from '../../Config';

interface SignedObject {
    error: Error | null;
    data: any;
}

class Token {
    /**
     * Create a token
     * @param {String} data
     * @returns {SignedObject}
     */
    static sign(data: string, options = {
        expiresIn: '7d',
    }): SignedObject {
        try {

            if (!data) {
                return {
                    error: null,
                    data: null,
                };
            }

            const signed = jwt.sign(data, Encryption.jwtKey, { ...options });

            return {
                error: null,
                data: signed,
            };
        } catch (e: any) {
            return {
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
    static verify(data: string, options?: any): SignedObject {
        try {

            if (!data) {
                return {
                    error: null,
                    data: null,
                };
            }

            const verified = jwt.verify(data, Encryption.jwtKey, { ...options });

            return {
                error: null,
                data: verified,
            };
        } catch (e: any) {
            return {
                error: e,
                data: null,
            };
        }
    }
}

export default Token;

export { Token }