const path = require('path');
const chalk = require("chalk")
const fs = require('fs');

const defaultColors = {
    Debug: chalk.magenta("Debug"),
    Info: chalk.blue("Info"),
    Warn: chalk.yellow("Warn"),
    Error: chalk.red("Error"),
    Loaded: chalk.green("Loaded")
}

const important = {
    colors: { // These are types that are important and only able to be accessed if logger is disabled (For errors & Server Info)
        Debug: chalk.magenta("Debug"),
        Info: chalk.blue("Info"),
        Warn: chalk.yellow("Warn"),
        Error: chalk.red("Error"),
        Loaded: chalk.green("Loaded")
    },
    types: ["Debug", "Info", "Warn", "Error", "Loaded"],
    format: "[{DATE} {TYPE}] {MESSAGE}"
}

const types = {
    path: "string",
    fileName: "string",
    logFormat: "string",
    logTypes: "object",
    logFile: "boolean"
}

class logger {
    /**
     * @param {Object} obj Settings object 
     * @param {String} obj.path The Dir where the logs will be stored
     * @param {String} obj.fileName The logs File name
     * @param {String} obj.logFormat The format of the log messages
     * @param {Array<String>|["Debug"]|["Info"]|["Warn"]|["Error"]} obj.logTypes The types you can use to log things
     * @param {Boolean} obj.logOld If you want to log the old data in the log files.
     * @param {Array<String>|String} obj.logOldIgnore The stuff you want to ignore from the old log files
     */
    constructor(obj) {
        
        if (obj == "default") obj = {
            path: "./logs",
            fileName: "{DATE}.log",
            logFormat: "[{DATE} {TYPE}] {MESSAGE}",
            logTypes: ["Debug", "Info", "Warn", "Error", "Loaded"],
            logFile: process.env.logFile == "true" ? true : false
        }

        for (let i = 0; i < obj.logTypes.length; i++) {
            logger.prototype[obj.logTypes[i]?.toLowerCase()] = (...msg) => this.log(this.logTypes[i], msg.join(" ")) 
        }

        if (process.env.log == "true") {

            /**
             * @type {String}
             */
            this.path = obj?.path; // The DIRECTORY where the log files will be stored

            /**
             * @type {String}
             */
            this.fileName = obj?.fileName ? obj.fileName : "{DATE}"; // The name of the log file (without extension) like "{DATE}.log"

            /**
             * @type {String}
             */
            this.logFormat = obj?.logFormat ? obj.logFormat : "[{DATE} {TYPE}] {MESSAGE}"; // The format of the log message like "[{DATE} {TYPE}] {MESSAGE}"

            /**
             * @type {obj.logTypes}
             */
            this.logTypes = obj?.logTypes ? obj?.logTypes : ["Debug", "Info", "Warn", "Error"]; // The types of logs that will be stored

            /**
             * @type {Boolean}
             */
            this.logFile = obj?.logFile ? obj.logFile : false // If true then the logs will be stored in a file

            for (const i in obj) {
                const extype = types?.[i]
                const gttype = (typeof obj[i])

                if (gttype !== extype) throw new Error(`${i} Expected ${extype} but got ${gttype}`)
            }


            if (this.logFile) this.log("Warn", "Logging to files is not recommended. Doing so can and will leak User IPs.")
        }


        for (let i = 0; i < important.types.length; i++) {
            logger.prototype.important[important.types[i].toLowerCase()] = (...msg) => this.importantLog(important.types[i], msg.join(" "))
        }

    }

    /**
     * The log function (Log a Message & Type)
     * @public
     * @example 
     * const logger = new logger({path: "../logs", consoleLog: true})
     * 
     * logger.log("Debug", "Hello, This is a Debug Message") // logger.debug("Hello, This is a Debug Message")
     * @param {String} type The type (Debug, Info ETC)
     * @param {Array<String>} message The Messages
     */
    log(type, ...message) {
        try {
            if (process.env.log == "false") return

            const date = new Date().toLocaleString("US", {
                hour12: false,
            })

            if (this.logFile) {
                this.write(this.logFormat.replace("{DATE}", date).replace("{TYPE}", type).replace("{MESSAGE}", message.join(" ")));
            }

            console.log(this.logFormat.replace("{DATE}", (chalk.gray(date))).replace("{TYPE}", (defaultColors?.[type] || type)).replace("{MESSAGE}", chalk.cyan(message.join(" "))))

        } catch (err) {
            throw err;
        }
    }

    important() {}

    /**
     * The log function (Log a Message & Type)
     * @public
     * @example 
     * const logger = new logger({path: "../logs", consoleLog: true})
     * 
     * logger.log("Debug", "Hello, This is a Debug Message") // logger.debug("Hello, This is a Debug Message")
     * @param {String} type The type (Debug, Info ETC)
     * @param {Array<String>} message The Messages
     */
    importantLog(type, ...message) {
        try {
            const date = new Date().toLocaleString("US", {
                hour12: false,
            })

            console.log(important.format.replace("{DATE}", (chalk.gray(date))).replace("{TYPE}", (important.colors?.[type] || type)).replace("{MESSAGE}", chalk.cyan(message.join(" "))))

        } catch (err) {
            throw err;
        }
    }

    /**
     * To write to the log file easily.
     * @private
     * @param {String} log The text to log to the file
     */
    write(log) {
        try {
            const writeDate = new Date();

            const filePath = path.join(this.path, this.fileName.replace("{DATE}", `${writeDate.getFullYear()}-${writeDate.getMonth()}-${writeDate.getDate()}`));

            if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "")

            fs.appendFileSync(filePath, fs.readFileSync(filePath, "utf-8") ? "\n" + log : log, "utf-8")

        } catch (err) {
            throw err;
        }
    }

    /**
     * Gets a certain amount of specified logs and returns it in an array of strings
     * @param {Number} amount The amount you want to get of the old logs
     * @param {Array<String>|String} ignoreText A string you would like to ignore i.e "Server Starting..., Server Started" (* for anything)
     * @param {Date} logDate The date to get the logs for 
     * @returns {Array<String>} The logs
     */
    getLogs(amount = 5, ignoreText, logDate = new Date()) {
        let filePath = path.join(this.path, this.fileName.replace("{DATE}", `${logDate.getFullYear()}-${logDate.getMonth()}-${logDate.getDate()}`));

        const logs = fs.readFileSync(filePath, "utf-8")?.split("\n")?.reverse()

        let tmpLogs = [];
        let returnLogs = [];

        for (let i = 0; i < logs.length; i++) {

            const logSplitted = logs[i].split(new RegExp(/\[(.*)\/(.*)\/(.*), (.*):(.*):(.*) (.*)\] /))


            if (typeof ignoreText == "object") {
                let con = false;
                for (let j = 0; j < ignoreText?.length; j++) {
                    let regey = new RegExp(ignoreText[j]?.replaceAll("*", "(.*)"))

                    if (regey.test(logSplitted[logSplitted.length - 1])) {
                        con = true;
                        continue;
                    }
                }

                if (con) continue;
            } else if (typeof ignoreText == "string") {
                let regey = new RegExp(ignoreText.replaceAll("*", "(.*)"))

                if (regey.test(logSplitted[logSplitted.length - 1])) continue;
            }

            tmpLogs.push(logs[i])
        }

        for (let i = 0; i < amount; i++) {
            if (typeof tmpLogs[i] == "undefined") continue
            returnLogs.push(tmpLogs[i])
        }

        returnLogs.reverse();

        return returnLogs;
    }
}

module.exports = logger;