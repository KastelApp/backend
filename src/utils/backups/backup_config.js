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


/**
 * @type {import('../config.types').Config}
 */
module.exports.config = this;

/**
 * @type {import('../config.types').Server}
 */
module.exports.Server = {
    port: 62250,
    cookieSecrets: ['cs5x6jmJ8U3WJ31eWWyg9Kch1UNFzYhd', 'tests'],
    domain: 'kastelapp.org',
    workerId: 1,
    cache: {
        clearInterval: 1000 * 60 * 60 * 6, // six hours
        clearOnStart: false,
    },
};

/**
 * @type {import('../config.types').Encryption}
 */
module.exports.Encryption = {
    algorithm: 'aes-256-cbc',
    initVector: '*&1a1oxm&y%bfcco',
    securityKey: 'csimhui!55gsiw7x21g@9m#x2nfp8@ct',
    jwtKey: 'tvi7#te-y#u2u4xtdzc1owe83fh2*7i^j1q9w9nkf&2hkq`pdzdarkersuxyn8y5joa$ts^6e-$g#2hjk&w@tgurj@in3w1flvk',
};

/**
 * @type {import('../config.types').Ws}
 */
module.exports.Ws = {
    url: 'wss://ws.kastelapp.org',
    user: 'Kastel-Worker-0',
    password: '',
};

/**
 * @type {import('../config.types').Redis}
 */
module.exports.Redis = {
    host: '127.0.0.1',
    port: '6379',
    user: '',
    password: '',
    db: '',
};

/**
 * @type {import('../config.types').MongoDB}
 */
module.exports.MongoDB = {
    user: '',
    host: '127.0.0.1',
    port: '27017',
    password: '',
    database: '',
    authSource: '',
    uri: 'mongodb://127.0.0.1:27017/kastel',
};

/**
 * @type {import('../config.types').Logger}
 */
module.exports.Logger = {
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
            load: 'green',
        },
        message: {
            debug: 'magenta',
            info: 'cyan',
            log: 'cyan',
            warn: 'yellow',
            error: 'red',
            load: 'green',
        },
    },
};

/**
 * @type {import('../config.types').Snowflake}
 */
module.exports.Snowflake = {
    epoch: 1641016800000,
    workerId: (this?.Server?.workerId || 0),
    datacenterId: 1,
    workerId_Bytes: 6,
    datacenterId_Bytes: 5,
    sequence_Bytes: 12,
};

module.exports.Regexs = {
    // Source: https://regexr.com/2rhq7
    email: new RegExp(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/),
    // Source: https://regexr.com/3bfsi
    password: new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/),
};

module.exports.Constants = require('./constants');