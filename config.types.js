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
 * @typedef {Object} ColorChoices The colors that can be used for log types (Can be hex)
 * @property {import('./src/Types').ChalkColors} debug The color of the debug messages
 * @property {import('./src/Types').ChalkColors} info The color of the info messages
 * @property {import('./src/Types').ChalkColors} log The color of the log messages
 * @property {import('./src/Types').ChalkColors} warn The color of the warn messages
 * @property {import('./src/Types').ChalkColors} error The color of the error messages
 * @property {import('./src/Types').ChalkColors} loaded The color of the loaded messages
 */

/**
 * @typedef {Object} Colors
 * @property {ColorChoices} level The colors for the log levels
 * @property {ColorChoices} message The colors for the log messages
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
 * @property {string} date_type The format for the date (i.e dd/mm/yyyy)
 * @property {Colors} colors The colors for the log levels and messages
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


module.exports = {
    /**
     * @type {Config}
     */
    config: {},
    /**
     * @type {Server}
     */
    Server: {},
    /**
     * @type {Encryption}
     */
    Encryption: {},
    /**
     * @type {Ws}
     */
    Ws: {},
    /**
     * @type {Redis}
     */
    Redis: {},
    /**
     * @type {MongoDB}
     */
    MongoDB: {},
    /**
     * @type {Logger}
     */
    Logger: {},
    /**
     * @type {Snowflake}
     */
    Snowflake: {},
};