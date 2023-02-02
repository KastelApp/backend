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

const crypto = require('crypto');
const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';

/**
 * Generates a random invite with a selected length
 * @param {Number} [Length=15] The length
 * @returns {String} The new Invite
 */
const InviteGenerator = (Length: number = 15): string => {
    if (typeof Length !== 'number' || isNaN(Number(Length))) {
        throw new TypeError(`"length" argument is expected to be a number, Got ${typeof Length}`);
    }

    let Invite = '';

    for (let i = 0; i < Number(Length); i++) {
        const randomByte = crypto.randomBytes(1);
        
        const randomIndex = randomByte[0] % chars.length;
        
        Invite += chars[randomIndex];
    }

    return Invite;
};

export default InviteGenerator;

export { InviteGenerator };