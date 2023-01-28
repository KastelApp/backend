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

// This is a zero-dependency module that allows you to use colors in the console. (Used for testing logger)

/**
 * Color a string (In case Node_modules have not be installed)
 * @param { 'red' | 'blue' | 'cyan' | 'green' | 'yellow' } type The type of color you would like
 * @param {...string} strings The strings you would like to log
 * @returns {string} The new Color string
 */
 const colors = (type, ...strings) => {
    const colorTypes = {
        red: {
            open: '\x1B[31m',
            close: '\x1B[39m',
        },
        blue: {
            open: '\x1B[34m',
            close: '\x1B[39m',
        },
        cyan: {
            open: '\x1B[36m',
            close: '\x1B[39m',
        },
        green: {
            open: '\x1B[32m',
            close: '\x1B[39m',
        },
        yellow: {
            open: '\x1B[33m',
            close: '\x1B[39m',
        },
    };

    const colorType = colorTypes[type] || colorTypes.cyan;

    return `${colorType.open}${strings.join(' ')}${colorType.close}`;
};

module.exports = colors;