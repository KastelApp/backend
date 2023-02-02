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

import type { Encryption, Logger, MongoDB, Redis, Server, Snowflake, Ws } from "./Types/Config";


const Server: Server = {
    Port: 62250,
    CookieSecrets: [''],
    Domain: '',
    WorkerId: 1,
    Cache: {
        ClearInterval: 1000 * 60 * 60 * 6, // six hours
        ClearOnStart: false,
    },
    StrictRouting: true,
};

const Encryption: Encryption = {
    Algorithm: '',
    InitVector: '',
    SecurityKey: '',
    JwtKey: '',
};

const Ws: Ws = {
    Url: '',
    User: '0',
    Password: '',
};

const Redis: Redis = {
    Host: '',
    Port: '',
    User: '',
    Password: '',
    Db: '',
};

const MongoDB: MongoDB = {
    User: '',
    Host: '',
    Port: '80',
    Password: '',
    Database: 'kastel',
    AuthSource: '',
    Uri: '',
};

const Logger: Logger = {
    LoggerEnabled: true,
    TimeStartUp: true,
    SaveInFiles: true,
    Path: './logs',
    Format: '[{DATE} {LEVEL}] {MESSAGE}',
    Color: true,
    Log: true,
    LogRoutes: false,
    LogLogo: true,
    LogErrors: true,
    LogInfo: true,
    DateType: 'en-US',
    Colors: {
        Level: {
            Debug: 'magenta',
            Info: 'cyan',
            Log: 'cyan',
            Warn: 'yellow',
            Error: 'red',
            Loaded: 'green',
        },
        Message: {
            Debug: 'magenta',
            Info: '#FFC0CB',
            Log: 'pink',
            Warn: 'yellow',
            Error: 'red',
            Loaded: 'green',
        },
    },
};

const Snowflake: Snowflake = {
    Epoch: 1641016800000,
    WorkerId: 0,
    DatacenterId: 1,
    WorkerIdBytes: 6,
    DatacenterIdBytes: 5,
    SequenceBytes: 12,
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