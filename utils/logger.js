const path = require('path');
const chalk = require("chalk")
const fs = require('fs');
const EventEmitter = require('events');

const defaultColors = {
    Debug: chalk.magenta("Debug"),
    Info: chalk.blue("Info"),
    Warn: chalk.yellow("Warn"),
    Error: chalk.red("Error")
}

const types = {
    path: "string",
    fileName: "string",
    logFormat: "string",
    logTypes: "object",
    consoleLog: "boolean",
    logCheck: "boolean",
    logOld: "boolean",
    logOldIgnore: "object"
}

class logger extends EventEmitter {
    /**
     * @param {Object} obj Settings object 
     * @param {String} obj.path The Dir where the logs will be stored
     * @param {String} obj.fileName The logs File name
     * @param {String} obj.logFormat The format of the log messages
     * @param {Array<String>|["Debug"]|["Info"]|["Warn"]|["Error"]} obj.logTypes The types you can use to log things
     * @param {Boolean} obj.consoleLog If to log or not log to the console
     * @param {Boolean} obj.logOld If you want to log the old data in the log files.
     * @param {Array<String>|String} obj.logOldIgnore The stuff you want to ignore from the old log files
     */
    constructor(obj) {
        super()

        if (obj == "default") obj = {
            path: "./logs",
            fileName: "{DATE}.log",
            logFormat: "[{DATE} {TYPE}] {MESSAGE}",
            logTypes: ["Debug", "Info", "Warn", "Error"],
            consoleLog: true,
            logCheck: false,
            logOld: false,
            logOldIgnore: []
        }

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
         * @type {Array<String>}
         */
        this.logTypes = obj?.logTypes ? obj?.logTypes : ["Debug", "Info", "Warn", "Error"]; // The types of logs that will be stored

        /**
         * @type {Boolean}
         */
        this.consoleLog = obj?.consoleLog ? obj.consoleLog : false; // If true, the log will be printed to the console

        /**
         * @type {Boolean}
         */
        this.logCheck = obj?.logCheck ?? true; // If false, the logger will not check if the log type is valid

        /**
         * @type {Boolean}
         */
        this.logOld = obj?.logOld ?? false; // if False, The old data in log files will not be outputed in the console

        /**
         * @type {Array<String>}
         */
        this.logOldIgnore = obj?.logOldIgnore ? obj.logOldIgnore : [] // The strings to ignore * for anything

        for (const i in obj) {
            let extype = types?.[i]
            let gttype = (typeof obj[i])

            if (gttype !== extype) throw new Error(`${i} Expected ${extype} but got ${gttype}`)
        }

        for (let i = 0; i < this.logTypes.length; i++) {
            this[this.logTypes[i]?.toLowerCase()] = (...msg) => this.customLog(this.logTypes[i], msg.join(" "))
        }

        if (this.logOld) this.logOldMsgs()
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
            let date = new Date().toLocaleString("US", {
                hour12: false,
            })

            let log = this.logFormat.replace("{DATE}", date).replace("{TYPE}", type).replace("{MESSAGE}", message.join(" "));

            this.write(log);

            if (this.consoleLog) {
                console.log(this.logFormat.replace("{DATE}", (chalk.gray(date))).replace("{TYPE}", (defaultColors?.[type] || type)).replace("{MESSAGE}", chalk.cyan(message.join(" "))))
            }

        } catch (err) {
            if (this.listenerCount("error") > 0) {
                this.emit("error", err);
            } else {
                throw err;
            }
        }
    }

    /**
     * @private
     * @see {log}
     */
    customLog(type, ...message) {
        try {
            let date = new Date().toLocaleString("US", {
                hour12: false,
            })

            let log = this.logFormat.replace("{DATE}", date).replace("{TYPE}", type).replace("{MESSAGE}", message.join(" "));

            this.write(log);

            if (this.consoleLog) {
                console.log(this.logFormat.replace("{DATE}", (chalk.gray(date))).replace("{TYPE}", (defaultColors?.[type] || type)).replace("{MESSAGE}", chalk.cyan(message.join(" "))))
            }

        } catch (err) {
            if (this.listenerCount("error") > 0) {
                this.emit("error", err);
            } else {
                throw err;
            }
        }
    }

    /**
     * To write to the log file easily.
     * @private
     * @param {String} log The text to log to the file
     */
    write(log) {
        try {
            let filePath = path.join(this.path, this.fileName.replace("{DATE}", `${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDate()}`)); // possible issue, If the client/server is lagging/has high ram/cpu usage its possible that the dates will be wrong or if the logger is logging a ton of data it could return the wrong Year, Month and or Day depending on the time easy fix is to get the new date then get the Year, Month and Day or let the user set how many ms ahead it should look to "count" the new day 

            if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "")

            fs.appendFileSync(filePath, fs.readFileSync(filePath, "utf-8") ? "\n" + log : log, "utf-8")

        } catch (err) {
            if (this.listenerCount("error") > 0) {
                this.emit("error", err);
            } else {
                throw err;
            }
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

    logOldMsgs() {
        const logDate = new Date();
        const ignoreText = this.logOldIgnore;
        const amount = 20;
        const logs = this.getLogs(amount, ignoreText, logDate)

        for (let i = 0; i < logs.length; i++) {
            console.log(logs[i])
        }
    }
}

module.exports = logger;