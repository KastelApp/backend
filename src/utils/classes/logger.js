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
    zlib = require('node:zlib'),
    chalk = require('chalk'),
    { Logger: log } = require('../../config');

const level_colors = {
    debug: (chalk?.[log.colors.level.debug] ? chalk[log.colors.level.debug]('Debug') : chalk.hex(log.colors.level.debug)('Debug')) || chalk.hex('#FF00FF')('Debug'),
    info: (chalk?.[log.colors.level.info] ? chalk[log.colors.level.info](' Info') : chalk.hex(log.colors.level.info)(' Info')) || chalk.hex('#00FFFF')(' Info'),
    log: (chalk?.[log.colors.level.log] ? chalk[log.colors.level.log]('  Log') : chalk.hex(log.colors.level.log)('  Log')) || chalk.hex('#00FFFF')('  Log'),
    warn: (chalk?.[log.colors.level.warn] ? chalk[log.colors.level.warn](' Warn') : chalk.hex(log.colors.level.warn)(' Warn')) || chalk.hex('#FFFF00')(' Warn'),
    error: (chalk?.[log.colors.level.error] ? chalk[log.colors.level.error]('Error') : chalk.hex(log.colors.level.error)('Error')) || chalk.hex('#FF0000')('Error'),
    load: (chalk?.[log.colors.level.load] ? chalk[log.colors.level.load](' Load') : chalk.hex(log.colors.level.load)(' Load')) || chalk.hex('#00FF00')(' Load'),
};

const message_colors = {
    debug: (chalk?.[log.colors.message.debug] ? chalk[log.colors.message.debug] : chalk.hex(log.colors.message.debug)) || chalk.hex('#FF00FF'),
    info: (chalk?.[log.colors.message.info] ? chalk[log.colors.message.info] : chalk.hex(log.colors.message.info)) || chalk.hex('#00FFFF'),
    log: (chalk?.[log.colors.message.log] ? chalk[log.colors.message.log] : chalk.hex(log.colors.message.log)) || chalk.hex('#00FFFF'),
    warn: (chalk?.[log.colors.message.warn] ? chalk[log.colors.message.warn] : chalk.hex(log.colors.message.warn)) || chalk.hex('#FFFF00'),
    error: (chalk?.[log.colors.message.error] ? chalk[log.colors.message.error] : chalk.hex(log.colors.message.error)) || chalk.hex('#FF0000'),
    load: (chalk?.[log.colors.message.load] ? chalk[log.colors.message.load] : chalk.hex(log.colors.message.load)) || chalk.hex('#00FF00'),
};

const format = log.format ?? '[{DATE} {LEVEL}] {MESSAGE}';

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
        logger.customLevel('debug', false, ...msg);
    }

    /**
     *
     * @param  {...String} msg What you want to log
     * @returns {Logger} Logger for chaining
     */
    static info(...msg) {
        logger.customLevel('info', false, ...msg);
    }

    /**
     *
     * @param  {...String} msg What you want to log
     * @returns {Logger} Logger for chaining
     */
    static log(...msg) {
        logger.customLevel('log', false, ...msg);
    }

    /**
     *
     * @param  {...String} msg What you want to log
     * @returns {Logger} Logger for chaining
     */
    static warn(...msg) {
        logger.customLevel('warn', false, ...msg);
    }

    /**
     *
     * @param  {...String} msg What you want to log
     * @returns {Logger} Logger for chaining
     */
    static error(...msg) {
        logger.customLevel('error', false, ...msg);
    }

    /**
     *
     * @param  {...String} msg What you want to log
     * @returns {Logger} Logger for chaining
     */
    static loaded(...msg) {
        logger.customLevel('Load', false, ...msg);
    }

    /**
     * @private
     * @param {String} level The log level
     * @param  {...String} msg The message to log
     * @returns {Logger} Logger for chaining
     */
    static customLevel(level, importa, ...msg) {
        const date = new Date().toLocaleString(log.date_type, {
            hour12: false,
        });

        if (log.log || importa) {
            if (log.color) {
                console.log(format.replaceAll('{DATE}', (chalk.gray(date))).replaceAll('{LEVEL}', (level_colors[level.toLowerCase()])).replaceAll('{MESSAGE}', message_colors[level.toLowerCase()](msg.join(' '))));
            } else {
                console.log(format.replaceAll('{DATE}', date).replaceAll('{LEVEL}', logger.lengthFixer(level)).replaceAll('{MESSAGE}', msg.join(' ')));
            }
        }

        if (log.saveInFiles) logger.write(format.replaceAll('{DATE}', date).replaceAll('{LEVEL}', level).replaceAll('{MESSAGE}', msg.join(' ')));

        return importa ? logger.important : logger;
    }

    /**
     * @returns {Logger}
     */
    static get important() {
        return {
            debug: (...msg) => logger.customLevel('Debug', true, msg.join(' ')),
            info: (...msg) => logger.customLevel('Info', true, msg.join(' ')),
            log: (...msg) => logger.customLevel('Log', true, msg.join(' ')),
            warn: (...msg) => logger.customLevel('Warn', true, msg.join(' ')),
            error: (...msg) => logger.customLevel('Error', true, msg.join(' ')),
            loaded: (...msg) => logger.customLevel('Load', true, msg.join(' ')),
        };
    }

    /**
     * @private
     * @param  {...String} logs
     */
    static write(...logs) {

        if (!fs.existsSync(path.join(__dirname, '../../../', log.path))) fs.mkdirSync(path.join(__dirname, '../../../', log.path));
        if (!fs.existsSync(path.join(__dirname, '../../../', log.path, 'latest.log'))) fs.appendFileSync(path.join(__dirname, '../../../', log.path, 'latest.log'), '');

        const latest = fs.statSync(path.join(__dirname, '../../../', log.path, 'latest.log'));

        if (new Date(latest.birthtime).toLocaleDateString() !== new Date().toLocaleDateString()) {
            const oldDate = new Date(latest.birthtime).toLocaleDateString(log.date_type).split('/').map((x) => x.padStart(2, '0')).join('-');

            const oldFile = fs.createReadStream(path.join(__dirname, '../../../', log.path, 'latest.log'));

            if (latest.size !== 0) {
                oldFile.pipe(zlib.createGzip()).pipe(fs.createWriteStream(path.join(__dirname, '../../../', log.path, `${oldDate}.log.gz`)));

                oldFile.on('end', () => {
                    fs.unlink(path.join(__dirname, '../../../', log.path, 'latest.log'), () => {
                        fs.writeFileSync(path.join(__dirname, '../../../', log.path, 'latest.log'), logs.join(' '), 'utf-8');
                    });
                });
            } else {
                fs.unlinkSync(path.join(__dirname, '../../../', log.path, 'latest.log'));
                fs.writeFileSync(path.join(__dirname, '../../../', log.path, 'latest.log'), logs.join(' '), 'utf-8');
            }
        } else {
            fs.appendFileSync(path.join(__dirname, '../../../', log.path, 'latest.log'), fs.readFileSync(path.join(__dirname, '../../../', log.path, 'latest.log'), 'utf-8') ? '\n' + logs.join(' ') : logs.join(' '), 'utf-8');
        }

    }

    /**
     * @private
     * @param {String} level
     * @returns {String}
     */
    static lengthFixer(level) {
        return level.padStart(5);
    }

    static get Settings() {
        return log;
    }
}

module.exports = logger;