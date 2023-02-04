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

const uriGenerator = (): string => {

    if (MongoDB.Uri) return MongoDB.Uri;

    const user = MongoDB.User;
    const host = MongoDB.Host;
    const port = MongoDB.Port;
    const password = MongoDB.Password;
    const database = MongoDB.Database || user;
    const authSource = MongoDB.AuthSource;

    return `mongodb://${user}${password ? `:${encodeURIComponent(password)}` : ''}@${host}${port ? `:${port}` : ''}/${database}${authSource ? `?authSource=${authSource}` : ''}`;
};

export default uriGenerator;

export { uriGenerator }