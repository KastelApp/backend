/*! 
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║     
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

const { config } = require("../config");

/**
 * Generates a MongoDB URI
 * @returns {String} The MongoDB URI
 */
const uriGenerator = () => {

    if (config.MongoDB.uri) return config.MongoDB.uri;

    const user = config.MongoDB.user;
    const host = config.MongoDB.host;
    const port = config.MongoDB.port;
    const password = config.MongoDB.password;
    const database = config.MongoDB.database || user;
    const authSource = config.MongoDB.authSource;

    return `mongodb://${user}${password ? `:${encodeURIComponent(password)}` : ""}@${host}${port ? `:${port}` : ""}/${database}${authSource ? `?authSource=${authSource}` : ""}`
};

module.exports = uriGenerator;