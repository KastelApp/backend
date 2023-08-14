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

import crypto from 'node:crypto';

const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';

/**
 * Generates a random invite with a selected length
 */
const InviteGenerator = (Length = 15): string => {
	if (Number.isNaN(Length)) {
		throw new TypeError(
			`"length" argument is expected to be a number, Got ${typeof Length === 'number' ? 'NaN' : typeof Length}`,
		);
	}

	const randomBytes = crypto.randomBytes(Length);
	return [...randomBytes].map((byte) => chars[byte % chars.length]).join('');
};

export default InviteGenerator;

export { InviteGenerator };
