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

const fs = require('node:fs');
const path = require('node:path');

/**
 * Goes through each DIR and adds them to the Array.
 * @param {String} fipath
 * @param {string[]} arr
 * @returns {string[]}
 */
const thrandthr = (fipath, arr) => {
    const dirArray = (arr || []);

    const filePath = (fipath || path.join(__dirname, '..', 'routes'));

    const fileInfo = fs.statSync(filePath);

    if (fileInfo.isDirectory()) {
        const files = fs.readdirSync(filePath);
        for (let i = 0; i < files.length; i++) {
            const fi = fs.statSync(path.join(filePath, files[i]));

            if (fi.isDirectory()) {
                thrandthr(path.join(filePath, files[i]), dirArray);
            } else {
                dirArray.push(path.join(filePath, files[i]));
            }
        }
    } else {
        dirArray.push(filePath);
    }

    return dirArray;
};

/**
 * Requires all the routes.
 * @returns {string[]} The route paths
 */
const routeLoader = () => {
    const fipaths = thrandthr(null, []);

    for (let i = 0; i < fipaths.length; i++) {
        require(fipaths[i]);
    }

    return fipaths;
};

module.exports = routeLoader;