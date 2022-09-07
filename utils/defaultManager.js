/*! 
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║     
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

// ToDo: Go through an array and set the items in temp object

/**
 * Manages Defaults
 * @param {*} defaults 
 * @param {*} provided 
 * @returns {*} The defaults and provided mixed
 */
const defaultManager = (defaults, provided) => {
    if (typeof defaults == "string") {
        if (!provided) return defaults
        else return provided
    }

    if (typeof defaults == "object" && !Array.isArray(defaults)) {
        const tempObject = {};

        for (const item in defaults) {
            if (typeof defaults[item] == "object" && !Array.isArray(defaults[item])) {
                for (const item2 in defaults[item]) {
                    if (typeof tempObject[item] == "undefined") tempObject[item] = {}

                    if (typeof provided?.[item]?.[item2] == "undefined") {
                        tempObject[item][item2] = defaults[item][item2]
                    } else {
                        tempObject[item][item2] = provided[item][item2]
                    }
                }
            } else if (typeof defaults[item] == "object" && Array.isArray(defaults[item])) {

                if (typeof provided?.[item] == "undefined") tempObject[item] = defaults[item]
                else tempObject[item] = provided[item]

            } else {
                if (typeof provided?.[item] == "undefined") tempObject[item] = defaults[item]
                else tempObject[item] = provided?.[item]
            }
        }

        return tempObject
    }
}

module.exports = defaultManager;