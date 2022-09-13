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

const path = require('node:path'),
    fs = require('node:fs'),
    chalk = require('chalk'),
    { Logger: log } = require('../../config');

const colors = {
    debug: chalk.magenta('Debug'),
    info: chalk.cyan(' Info'),
    log: chalk.cyan('  Log'),
    warn: chalk.yellow(' Warn'),
    error: chalk.red('Error'),
    Load: chalk.green(' Load'),
};

const format = log.format ?? '[{DATE} {TYPE}] {MESSAGE}';

/**
 * @typedef {Object} Important
 * @property {logger.debug} debug
 * @property {logger.info} info
 * @property {logger.warn} warn
 * @property {logger.error} error
 * @property {logger.loaded} loaded
 */

/**
 * @typedef {Object} Logger
 * @property {logger.debug} debug
 * @property {logger.info} info
 * @property {logger.warn} warn
 * @property {logger.error} error
 * @property {logger.loaded} loaded
 * @property {Important} important
 */

class logger {

    /**
     * Logs things for debug purposes
     * @param  {...String} msg What you want to log
     * @returns {Logger} Logger for chaining
     */
    static debug(...msg) {
        const date = new Date().toLocaleString('US', {
            hour12: false,
        });

        if (log.loggerEnabled) {
            if (log.log) {
                if (log.color) {
                    console.debug(format.replaceAll('{DATE}', (chalk.gray(date))).replaceAll('{TYPE}', (colors['debug'])).replaceAll('{MESSAGE}', chalk.blue(msg.join(' '))));
                } else {
                    console.debug(format.replaceAll('{DATE}', date).replaceAll('{TYPE}', logger.lengthFixer('Debug')).replaceAll('{MESSAGE}', msg.join(' ')));
                }
            }

            if (log.saveInFiles) logger.write(format.replaceAll('{DATE}', date).replaceAll('{TYPE}', 'Debug').replaceAll('{MESSAGE}', msg.join(' ')));
        }

        return logger;

    }

    /**
     *
     * @param  {...String} msg What you want to log
     * @returns {Logger} Logger for chaining
     */
    static info(...msg) {
        const date = new Date().toLocaleString('US', {
            hour12: false,
        });

        if (log.loggerEnabled) {
            if (log.log) {
                if (log.color) {
                    console.log(format.replaceAll('{DATE}', (chalk.gray(date))).replaceAll('{TYPE}', (colors['info'])).replaceAll('{MESSAGE}', chalk.blue(msg.join(' '))));
                } else {
                    console.log(format.replaceAll('{DATE}', date).replaceAll('{TYPE}', logger.lengthFixer('Info')).replaceAll('{MESSAGE}', msg.join(' ')));
                }
            }

            if (log.saveInFiles) logger.write(format.replaceAll('{DATE}', date).replaceAll('{TYPE}', 'Info').replaceAll('{MESSAGE}', msg.join(' ')));
        }

        return logger;
    }

    /**
     *
     * @param  {...String} msg What you want to log
     * @returns {Logger} Logger for chaining
     */
    static log(...msg) {
        const date = new Date().toLocaleString('US', {
            hour12: false,
        });

        if (log.loggerEnabled) {
            if (log.log) {
                if (log.color) {
                    console.log(format.replaceAll('{DATE}', (chalk.gray(date))).replaceAll('{TYPE}', (colors['log'])).replaceAll('{MESSAGE}', chalk.blue(msg.join(' '))));
                } else {
                    console.log(format.replaceAll('{DATE}', date).replaceAll('{TYPE}', logger.lengthFixer('Log')).replaceAll('{MESSAGE}', msg.join(' ')));
                }
            }

            if (log.saveInFiles) logger.write(format.replaceAll('{DATE}', date).replaceAll('{TYPE}', 'Log').replaceAll('{MESSAGE}', msg.join(' ')));
        }

        return logger;
    }

    /**
     *
     * @param  {...String} msg What you want to log
     * @returns {Logger} Logger for chaining
     */
    static warn(...msg) {
        const date = new Date().toLocaleString('US', {
            hour12: false,
        });

        if (log.loggerEnabled) {
            if (log.log) {
                if (log.color) {
                    console.warn(format.replaceAll('{DATE}', (chalk.gray(date))).replaceAll('{TYPE}', (colors['warn'])).replaceAll('{MESSAGE}', chalk.blue(msg.join(' '))));
                } else {
                    console.warn(format.replaceAll('{DATE}', date).replaceAll('{TYPE}', logger.lengthFixer('Warn')).replaceAll('{MESSAGE}', msg.join(' ')));
                }
            }

            if (log.saveInFiles) logger.write(format.replaceAll('{DATE}', date).replaceAll('{TYPE}', 'Warn').replaceAll('{MESSAGE}', msg.join(' ')));
        }

        return logger;
    }

    /**
     *
     * @param  {...String} msg What you want to log
     * @returns {Logger} Logger for chaining
     */
    static error(...msg) {
        const date = new Date().toLocaleString('US', {
            hour12: false,
        });

        if (log.loggerEnabled) {
            if (log.log) {
                if (log.color) {
                    console.error(format.replaceAll('{DATE}', (chalk.gray(date))).replaceAll('{TYPE}', (colors['error'])).replaceAll('{MESSAGE}', chalk.blue(msg.join(' '))));
                } else {
                    console.error(format.replaceAll('{DATE}', date).replaceAll('{TYPE}', logger.lengthFixer('Error')).replaceAll('{MESSAGE}', msg.join(' ')));
                }
            }

            if (log.saveInFiles) logger.write(format.replaceAll('{DATE}', date).replaceAll('{TYPE}', 'Error').replaceAll('{MESSAGE}', msg.join(' ')));
        }

        return logger;
    }

    /**
     *
     * @param  {...String} msg What you want to log
     * @returns {Logger} Logger for chaining
     */
    static loaded(...msg) {
        const date = new Date().toLocaleString('US', {
            hour12: false,
        });

        if (log.loggerEnabled) {
            if (log.log) {
                if (log.color) {
                    console.log(format.replaceAll('{DATE}', (chalk.gray(date))).replaceAll('{TYPE}', (colors['Load'])).replaceAll('{MESSAGE}', chalk.blue(msg.join(' '))));
                } else {
                    console.log(format.replaceAll('{DATE}', date).replaceAll('{TYPE}', logger.lengthFixer('Load')).replaceAll('{MESSAGE}', msg.join(' ')));
                }
            }

            if (log.saveInFiles) logger.write(format.replaceAll('{DATE}', date).replaceAll('{TYPE}', 'Load').replaceAll('{MESSAGE}', msg.join(' ')));
        }

        return logger;
    }

    /**
     * @private
     * @param {String} type The log type
     * @param  {...String} msg The message to log
     * @returns {Logger} Logger for chaining
     */
    static customType(type, ...msg) {
        const date = new Date().toLocaleString('US', {
            hour12: false,
        });

        if (log.color) {
            console.log(format.replaceAll('{DATE}', (chalk.gray(date))).replaceAll('{TYPE}', (colors[type.toLowerCase()])).replaceAll('{MESSAGE}', chalk.blue(msg.join(' '))));
        } else {
            console.log(format.replaceAll('{DATE}', date).replaceAll('{TYPE}', logger.lengthFixer(type)).replaceAll('{MESSAGE}', msg.join(' ')));
        }

        if (log.saveInFiles) logger.write(format.replaceAll('{DATE}', date).replaceAll('{TYPE}', type).replaceAll('{MESSAGE}', msg.join(' ')));

        return logger.important;
    }

    /**
     * @returns {Logger}
     */
    static get important() {
        return {
            debug: (...msg) => logger.customType('Debug', msg.join(' ')),
            info: (...msg) => logger.customType('Info', msg.join(' ')),
            log: (...msg) => logger.customType('Log', msg.join(' ')),
            warn: (...msg) => logger.customType('Warn', msg.join(' ')),
            error: (...msg) => logger.customType('Error', msg.join(' ')),
            loaded: (...msg) => logger.customType('Load', msg.join(' ')),
        };
    }

    /**
     * @private
     * @param  {...String} logs
     */
    static write(...logs) {
        const writeDate = new Date();

        const filePath = path.join(__dirname, '../../../', log.path, `${writeDate.getFullYear()}-${writeDate.getMonth()}-${writeDate.getDate()}.log`);

        if (!fs.existsSync(path.join(__dirname, '../../../', log.path))) fs.mkdirSync(path.join(__dirname, '../../', log.path));

        if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '');

        fs.appendFileSync(filePath, fs.readFileSync(filePath, 'utf-8') ? '\n' + logs.join(' ') : logs.join(' '), 'utf-8');
    }

    /**
     * @private
     * @param {String} type
     * @returns {String}
     */
    static lengthFixer(type) {
        return type.padStart(5);
    }
}

module.exports = logger;