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
 * @type {Config}
 */
module.exports.config = this;

/**
 * @type {Server}
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
 * @type {Encryption}
 */
module.exports.Encryption = {
    algorithm: 'aes-256-cbc',
    initVector: '*&1a1oxm&y%bfcco',
    securityKey: 'csimhui!55gsiw7x21g@9m#x2nfp8@ct',
    jwtKey: 'tvi7#te-y#u2u4xtdzc1owe83fh2*7i^j1q9w9nkf&2hkq`pdzdarkersuxyn8y5joa$ts^6e-$g#2hjk&w@tgurj@in3w1flvk',
};

/**
 * @type {Ws}
 */
module.exports.Ws = {
    url: 'wss://ws.kastelapp.org',
    user: 'Kastel-Worker-0',
    password: '',
};

/**
 * @type {Redis}
 */
module.exports.Redis = {
    host: '127.0.0.1',
    port: '6379',
    user: 'default',
    password: '',
    db: '',
};

/**
 * @type {MongoDB}
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
 * @type {Logger}
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
    type: 'en-US',
};

/**
 * @type {Snowflake}
 */
module.exports.Snowflake = {
    epoch: 1641016800000,
    workerId: (this?.Server?.workerId || 0),
    datacenterId: 1,
    workerId_Bytes: 6,
    datacenterId_Bytes: 5,
    sequence_Bytes: 12,
};

module.exports.Constants = require('./constants');

/**
 * @typedef {Object} Server
 * @property {number|string} [port=62250] The port the server will run on
 * @property {string[]} cookieSecrets The secrets for cookies (First one is to sign the rest are to verify)
 * @property {string} domain The main domain of the server
 * @property {number} [workerId=0] The Worker ID
 * @property {{clearInterval: number, clearOnStart: boolean}} cache
 */

/**
 * @typedef {Object} Encryption
 * @property {string} [algorithm=aes-256-cbc]
 * @property {string} initVector
 * @property {string} securityKey
 * @property {string} jwtKey
 */

/**
 * @typedef {Object} Ws
 * @property {string} url The Url to connect to the WS Server **include ws:\/\/ or wss:\/\/**
 * @property {string} user The user you will be connecting as
 * @property {string} password The password to verify the user
 */

/**
 * @typedef {Object} Redis
 * @property {string} [host=127.0.0.1]
 * @property {number|string} [port=6379]
 * @property {string} [user=default]
 * @property {string} [password=null]
 * @property {number|string} [db=0]
 */

/**
 * @typedef {Object} MongoDB
 * @property {string} user
 * @property {string} host
 * @property {string|number} port
 * @property {string} password
 * @property {string} database
 * @property {string} authSource
 * @property {string} uri
 */

/**
 * @typedef {Object} Logger
 * @property {Boolean} loggerEnabled If the logger is enabled (Important stuff will still be logged)
 * @property {Boolean} timeStartUp If the startup of the server should be timed
 * @property {Boolean} saveInFiles If you want all the logs saved in a file
 * @property {string} path If you want to save the logs in files this should be the dir path to store the logs
 * @property {string} format The log format Placeholders: ({DATE}, {TYPE}, {MESSAGE})
 * @property {Boolean} color If you want the console to have colors
 * @property {Boolean} log If you want to log things in the console or just saved in a file
 * @property {Boolean} logRoutes If you want to log the routes when loaded in the console
 * @property {Boolean} logLogo If you want to log the Kastel logo
 * @property {Boolean} logErrors If you want to catch errors or just have nodejs handle it
 * @property {Boolean} logInfo If you want some useful info logged in the console when the server is started up
 * @property {string} type The format for the date (i.e dd/mm/yyyy)
 */

/**
 * @typedef {Object} Snowflake
 * @property {number} [epoch=1641016800000]
 * @property {number} [workerId=0]
 * @property {number} [datacenterId=1]
 * @property {number} [workerId_Bytes=6]
 * @property {number} [datacenterId_Bytes=5]
 * @property {number} [sequence_Bytes=12]
 */

/**
 * @typedef {Object} Config
 * @property {Server} Server
 * @property {Encryption} Encryption
 * @property {Ws} Ws
 * @property {Redis} Redis
 * @property {MongoDB} MongoDB
 * @property {Logger} Logger
 * @property {Snowflake} Snowflake
 * @property {Object} Constants
 */