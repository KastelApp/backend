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
 * @typedef {Object} LengthOptions
 * @property {Number} length
 * @property {"less"|"more"|"equal"|"equals"|"LESS"|"MORE"|"EQUAL"|"EQUALS"|"==="|"=="|"=>"|"<="} type
 */

/**
 * Check the length of the item
 * @typedef {Function} lengthChecker
 * @param {*} val The value to check the length of
 * @returns {Boolean} Returns an {@link Boolean} depending on the {@link LengthOptions}
 */

/**
 *
 * @param {LengthOptions} options
 * @returns {lengthChecker}
 */
const lengthChecker = (options = {
    length: 3,
    type: 'LESS', // LESS <=, MORE >=, EQUAL ==, EQUALS ===
}) => {
    /**
     * @type {lengthChecker}
     */
    return (val) => {
        if (typeof options.length !== 'number') {
            options.otype = typeof options.length;
            options.length = Number(options.length);
        }
        if (typeof options.length !== 'number' || isNaN(options.length)) throw new Error(`length: Expected Number, Recived ${options.otype}`);

        if (!['less', 'more', 'equal', 'equals', '<=', '>=', '==', '==='].includes(options.type.toLowerCase())) throw new Error(`Type: Invalid type, ${options.type} not a valid type`);

        const valLength = (typeof val == 'number') ? val : (typeof val == 'object') ? val?.[0] ? val.length : Object.keys(val).length : null;

        switch (options.type.toLowerCase()) {
            case 'less':
            case '<=':
                return valLength <= options.length;
            case 'more':
            case '>=':
                return valLength >= options.length;
            case 'equal':
            case 'equals':
            case '===':
            case '==':
                return valLength === options.length;
        }
    };
};

module.exports = lengthChecker;