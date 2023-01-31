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

import { MongoDB } from '../Config';

/**
 * Generates a MongoDB URI
 * @returns {String} The MongoDB URI
 */
const uriGenerator = (): string => {

    if (MongoDB.uri) return MongoDB.uri;

    const user = MongoDB.user;
    const host = MongoDB.host;
    const port = MongoDB.port;
    const password = MongoDB.password;
    const database = MongoDB.database || user;
    const authSource = MongoDB.authSource;

    return `mongodb://${user}${password ? `:${encodeURIComponent(password)}` : ''}@${host}${port ? `:${port}` : ''}/${database}${authSource ? `?authSource=${authSource}` : ''}`;
};

export default uriGenerator;

export { uriGenerator }