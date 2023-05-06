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

import { MongoDB } from '../Config.js';

const uriGenerator = (): string => {
	const { Uri, User, Host, Port, Password, Database, AuthSource } = MongoDB;

	if (Uri) {
		return Uri;
	}

	let uri = 'mongodb://';

	if (User) {
		uri += encodeURIComponent(User);

		if (Password) {
			uri += `:${encodeURIComponent(Password)}`;
		}

		uri += '@';
	}

	uri += Host;

	if (Port) {
		uri += `:${Port}`;
	}

	uri += `/${Database}`;

	if (AuthSource) {
		uri += `?authSource=${encodeURIComponent(AuthSource)}`;
	}

	return uri;
};

export default uriGenerator;

export { uriGenerator };
