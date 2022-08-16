const path = require("node:path"),
    fs = require("node:fs"),
    chalk = require("chalk")

const colors = {
    debug: chalk.magenta("Debug"),
    info: chalk.blue("Info"),
    warn: chalk.yellow("Warn"),
    error: chalk.red("Error"),
    loaded: chalk.green("Loaded")
}

const format = process?.env?.loggerFormat ?? `[{DATE} {TYPE}] {MESSAGE}`

class logger {

    /**
     * Logs things for debug purposes
     * @param  {...String} msg What you want to log
     */
    static debug(...msg) {
        const date = new Date().toLocaleString("US", {
            hour12: false,
        })

        if (process.env.loggerEnabled) {
            if (process.env.loggerLog) {
                if (process.env.loggerColor) {
                    console.log(format.replaceAll("{DATE}", (chalk.gray(date))).replaceAll("{TYPE}", (colors["debug"])).replaceAll("{MESSAGE}", chalk.cyan(msg.join(" "))))
                } else {
                    console.log(format.replaceAll("{DATE}", date).replaceAll("{TYPE}", "Debug").replaceAll("{MESSAGE}", msg.join(" ")))
                }
            }

            if (process.env.loggerFilesEnabled) logger.write(format.replaceAll("{DATE}", date).replaceAll("{TYPE}", "Debug").replaceAll("{MESSAGE}", msg.join(" ")))
        }

    }

    /**
     * 
     * @param  {...String} msg What you want to log
     */
    static info(...msg) {
        const date = new Date().toLocaleString("US", {
            hour12: false,
        })

        if (process.env.loggerEnabled) {
            if (process.env.loggerLog) {
                if (process.env.loggerColor) {
                    console.log(format.replaceAll("{DATE}", (chalk.gray(date))).replaceAll("{TYPE}", (colors["info"])).replaceAll("{MESSAGE}", chalk.cyan(msg.join(" "))))
                } else {
                    console.log(format.replaceAll("{DATE}", date).replaceAll("{TYPE}", "Info").replaceAll("{MESSAGE}", msg.join(" ")))
                }
            }

            if (process.env.loggerFilesEnabled) logger.write(format.replaceAll("{DATE}", date).replaceAll("{TYPE}", "Info").replaceAll("{MESSAGE}", msg.join(" ")))
        }

    }

    /**
     * 
     * @param  {...String} msg What you want to log
     */
    static warn(...msg) {
        const date = new Date().toLocaleString("US", {
            hour12: false,
        })

        if (process.env.loggerEnabled) {
            if (process.env.loggerLog) {
                if (process.env.loggerColor) {
                    console.log(format.replaceAll("{DATE}", (chalk.gray(date))).replaceAll("{TYPE}", (colors["warn"])).replaceAll("{MESSAGE}", chalk.cyan(msg.join(" "))))
                } else {
                    console.log(format.replaceAll("{DATE}", date).replaceAll("{TYPE}", "Warn").replaceAll("{MESSAGE}", msg.join(" ")))
                }
            }

            if (process.env.loggerFilesEnabled) logger.write(format.replaceAll("{DATE}", date).replaceAll("{TYPE}", "Warn").replaceAll("{MESSAGE}", msg.join(" ")))
        }

    }

    /**
     * 
     * @param  {...String} msg What you want to log
     */
    static error(...msg) {
        const date = new Date().toLocaleString("US", {
            hour12: false,
        })

        if (process.env.loggerEnabled) {
            if (process.env.loggerLog) {
                if (process.env.loggerColor) {
                    console.log(format.replaceAll("{DATE}", (chalk.gray(date))).replaceAll("{TYPE}", (colors["error"])).replaceAll("{MESSAGE}", chalk.cyan(msg.join(" "))))
                } else {
                    console.log(format.replaceAll("{DATE}", date).replaceAll("{TYPE}", "Error").replaceAll("{MESSAGE}", msg.join(" ")))
                }
            }

            if (process.env.loggerFilesEnabled) logger.write(format.replaceAll("{DATE}", date).replaceAll("{TYPE}", "Error").replaceAll("{MESSAGE}", msg.join(" ")))
        }

    }

    /**
     * 
     * @param  {...String} msg What you want to log
     */
    static loaded(...msg) {
        const date = new Date().toLocaleString("US", {
            hour12: false,
        })

        if (process.env.loggerEnabled) {
            if (process.env.loggerLog) {
                if (process.env.loggerColor) {
                    console.log(format.replaceAll("{DATE}", (chalk.gray(date))).replaceAll("{TYPE}", (colors["loaded"])).replaceAll("{MESSAGE}", chalk.cyan(msg.join(" "))))
                } else {
                    console.log(format.replaceAll("{DATE}", date).replaceAll("{TYPE}", "Loaded").replaceAll("{MESSAGE}", msg.join(" ")))
                }
            }

            if (process.env.loggerFilesEnabled) logger.write(format.replaceAll("{DATE}", date).replaceAll("{TYPE}", "Loaded").replaceAll("{MESSAGE}", msg.join(" ")))
        }

    }

    static logImportant(type, ...msg) {
        const date = new Date().toLocaleString("US", {
            hour12: false,
        })

        if (process.env.loggerColor) {
            console.log(format.replaceAll("{DATE}", (chalk.gray(date))).replaceAll("{TYPE}", (colors[type.toLowerCase()])).replaceAll("{MESSAGE}", chalk.cyan(msg.join(" "))))
        } else {
            console.log(format.replaceAll("{DATE}", date).replaceAll("{TYPE}", type).replaceAll("{MESSAGE}", msg.join(" ")))
        }

        if (process.env.loggerFilesEnabled) logger.write(format.replaceAll("{DATE}", date).replaceAll("{TYPE}", type).replaceAll("{MESSAGE}", msg.join(" ")))
    }

    static get important() {
        return {
            /**
             * @param  {...String} msg What you want to log
             */
            debug: (...msg) => logger.logImportant("Debug", msg),
            /**
             * @param  {...String} msg What you want to log
             */
            info: (...msg) => logger.logImportant("Info", msg),
            /**
             * @param  {...String} msg What you want to log
             */
            warn: (...msg) => logger.logImportant("Warn", msg),
            /**
             * @param  {...String} msg What you want to log
             */
            error: (...msg) => logger.logImportant("Error", msg),
            /**
             * @param  {...String} msg What you want to log
             */
            loaded: (...msg) => logger.logImportant("Loaded", msg),
        }
    }

    /**
     * @private
     * @param  {...String} logs 
     */
    static write(...logs) {
        try {
            const writeDate = new Date();

            const filePath = path.join("./logs", `${writeDate.getFullYear()}-${writeDate.getMonth()}-${writeDate.getDate()}.log`)

            if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "")

            fs.appendFileSync(filePath, fs.readFileSync(filePath, "utf-8") ? "\n" + logs.join(" ") : logs.join(" "), "utf-8")

        } catch (err) {
            throw err;
        }
    }
}

module.exports = logger