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

const Base64 = {
	Encode(string: string): string {
		// Convert the string to base64
		const base64 = Buffer.from(string).toString('base64');

		// Replace + with F, / with q, and = with zT
		return base64.replaceAll('+', 'F').replaceAll('/', 'q').replace(/=+$/, 'zT');
	},

	Decode(string: string): string {
		// Replace F with +, q with /, and zT with =
		let base64 = string.replaceAll('F', '+').replaceAll('q', '/').replace(/zT$/, '');

		if (/[^\d.A-Za-z-]/.test(base64)) base64 = string;

		// Convert the base64 to string
		return Buffer.from(base64, 'base64').toString('utf8');
	},

	OldBase64(string: string): string {
		return string.replaceAll('+', 'F').replaceAll('/', 'q').replace(/=+$/, 'zT');
	},
};

export default Base64;

export { Base64 };
