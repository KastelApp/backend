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


const types = require('./schemaTypes/exports');

/**
 * Goes through data from MongoDB and returns new changed Data
 * @param {String} type
 * @param {*} data
 * @returns {data} The changed Schema Data (_id => id, created_date => creation_date)
 */
const schemaData = (type, data) => {

    /**
     * @type {import('./schemaTypes/SchemaTypes').Schema}
     */
    const tp = types[type];

    if (!tp) { throw new Error(`Unknown Type: ${type}`); }

    if (!(data instanceof tp.type)) { throw new TypeError(`${type} Expected ${tp.type.name} got ${typeof data}`); }


    if (tp.type == Object && Array.isArray(data)) { throw new TypeError(`${type} Expected ${tp.type.name} got Array`); }


    if (tp.type == Object) {
        const newObject = {};
        for (const item in tp.data) {
            const tpData = (tp.data[item]);
            const gotItem = data[tpData.name];

            if (!tpData.extended) {

                if (!(typeof gotItem == ((tpData.expected.name).toLowerCase())) && !(gotItem instanceof tpData.expected)) newObject[item] = tpData.default;
                else newObject[item] = gotItem;
            } else if (tpData.extended) { newObject[item] = schemaData(tpData.extends, gotItem); }
        }

        return newObject;
    }

    if (tp.type == Array) {
        const newArray = [];

        for (const item of data) {
            const newObject = {};
            for (const key in item) {
                for (const item2 in tp.data) {
                    const tpData = tp.data[item2];
                    if (tpData.name == key) {
                        const gotItem = item[key];
                        const arewethere = (Object.keys(tp.data).find((x) => tp.data[x].name == key) || key);

                        if (!tpData.extended) {
                            if (!(typeof gotItem == ((tpData.expected.name).toLowerCase())) && !(gotItem instanceof tpData.expected)) {
                                newObject[arewethere] = tpData.default;
                            } else {
                                newObject[arewethere] = gotItem;
                            }
                        } else if (tpData.extended) {
                            newObject[arewethere] = schemaData(tpData.extends, gotItem);
                        }
                    }
                }
            }
            newArray.push(newObject);
        }
        return newArray;
    }
};

module.exports = schemaData;