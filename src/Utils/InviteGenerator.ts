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

import crypto from "node:crypto";

const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";

/**
 * Generates a random invite with a selected length
 */
const inviteGenerator = (length = 15): string => {
	if (Number.isNaN(length)) {
		throw new TypeError(
			`"length" argument is expected to be a number, Got ${typeof length === "number" ? "NaN" : typeof length}`,
		);
	}

	const randomBytes = crypto.randomBytes(length);

	return [...randomBytes].map((byte) => chars[byte % chars.length]).join("");
};

export default inviteGenerator;

export { inviteGenerator as InviteGenerator };
