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

const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';

/**
 * Generates a random invite with a selected length
 * @param {Number} [length=15] The length
 * @returns {String} The new Invite
 */
const inviteGenerator = (length = 15) => {
    if (typeof length !== 'number' || isNaN(Number(length)))
        {throw new TypeError(`"length" argument is expected to be a number, Got ${isNaN(Number(length) ? 'NaN' : typeof length)}`);}


    let invite = '';

    for (let i = 0; i < Number(length); i++) {
        invite += chars[Math.floor(Math.random() * chars.length)];
    }

    return invite;
};

module.exports = inviteGenerator;