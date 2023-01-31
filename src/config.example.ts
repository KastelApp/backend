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

import { Encryption, Logger, MongoDB, Redis, Server, Snowflake, Ws } from "./Types/Config";


const Server: Server = {
    port: 62250,
    cookieSecrets: [''],
    domain: '',
    workerId: 1,
    cache: {
        clearInterval: 1000 * 60 * 60 * 6, // six hours
        clearOnStart: false,
    },
};

const Encryption: Encryption = {
    algorithm: '',
    initVector: '',
    securityKey: '',
    jwtKey: '',
};

const Ws: Ws = {
    url: 'wss://ws.kastelapp.org',
    user: 'Kastel-Worker-0',
    password: '',
};

const Redis: Redis = {
    host: '',
    port: '',
    user: '',
    password: '',
    db: '',
};

const MongoDB: MongoDB = {
    user: 'canary',
    host: '',
    port: '',
    password: '',
    database: 'kastel',
    authSource: '',
    uri: '',
};

const Logger: Logger = {
    loggerEnabled: true,
    timeStartUp: true,
    saveInFiles: true,
    path: './logs',
    format: '[{DATE} {LEVEL}] {MESSAGE}',
    color: true,
    log: true,
    logRoutes: false,
    logLogo: true,
    logErrors: true,
    logInfo: true,
    date_type: 'en-US',
    colors: {
        level: {
            debug: 'magenta',
            info: 'cyan',
            log: 'cyan',
            warn: 'yellow',
            error: 'red',
            loaded: 'green',
        },
        message: {
            debug: 'magenta',
            info: '#FFC0CB',
            log: 'pink',
            warn: 'yellow',
            error: 'red',
            loaded: 'green',
        },
    },
};

const Snowflake: Snowflake = {
    epoch: 1641016800000,
    workerId: 0,
    datacenterId: 1,
    workerId_Bytes: 6,
    datacenterId_Bytes: 5,
    sequence_Bytes: 12,
};

const Regexs: {
    [key: string]: RegExp;
} = {
    // Source: https://regexr.com/2rhq7
    email: new RegExp(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/),
    // Source: https://regexr.com/3bfsi
    password: new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/),
};

const Config = {
    Server,
    Encryption,
    Ws,
    Redis,
    MongoDB,
    Logger,
    Snowflake,
    Regexs,
}

export {
    Config,
    Server,
    Encryption,
    Ws,
    Redis,
    MongoDB,
    Logger,
    Snowflake,
    Regexs,
}

export default { 
    Config,
    Server,
    Encryption,
    Ws,
    Redis,
    MongoDB,
    Logger,
    Snowflake,
    Regexs,
}