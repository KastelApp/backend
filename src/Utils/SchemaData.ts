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

import schemaExports from './SchemaTypes/Exports';
import type { Schema } from '../Types/Schema'

const schemaData = (type: keyof typeof schemaExports, data: any): any => {

    const tp: Schema | undefined = schemaExports[type];

    if (!tp) {
        throw new Error(`Unknown Type: ${type}`);
    }

    if (!(typeof data === ((tp.type.name).toLowerCase())) && !(data instanceof tp.type)) {
        throw new TypeError(`${type} Expected ${tp.type.name} got ${data == null ? 'Null' : typeof data}\n\nData Dump: ${JSON.stringify(data, null, 4)}`);
    }

    if (tp.type === Object && Array.isArray(data)) {
        throw new TypeError(`${type} Expected ${tp.type.name} got Array`);
    }

    if (tp.type === Object) {
        const newObject: { [key: string]: any } = {};

        for (const item in tp.data) {
            const tpData = tp.data[item];

            if (!tpData) {
                throw new Error(`Couldn't find ${item} in ${type}`)
            }

            const gotItem = data[tpData.name as string];

            if (!tpData.extended) {
                if (!(typeof gotItem === ((tpData.expected.name).toLowerCase())) && !(gotItem instanceof tpData.expected)) {
                    if ((tpData.expected.name).toLowerCase() === 'date' && typeof gotItem === 'number') {
                        newObject[item] = gotItem;
                    } else {
                        newObject[item] = tpData.default;
                    }
                } else {
                    newObject[item] = gotItem;
                }
            } else if (tpData.extended) {
                newObject[item] = schemaData(tpData.extends as keyof typeof schemaExports, gotItem);
            }
        }

        return newObject;
    }

    if (tp.type === Array) {
        const newArray: any[] = [];

        for (const item of data) {
            const newObject: { [key: string]: any } = {};
            for (const key in item) {
                for (const item2 in tp.data) {
                    const tpData = tp.data[item2];

                    if (!tpData) {
                        throw new Error(`Couldn't find ${item2} in ${type}`)
                    }

                    if (tpData.name === key) {
                        const gotItem = item[key];

                        const arewethere = (Object.keys(tp.data).find((x) => tp?.data[x]?.name === key) || key);

                        if (!tpData.extended) {
                            if (!(typeof gotItem === ((tpData.expected.name).toLowerCase())) && !(gotItem instanceof tpData.expected)) {
                                if ((tpData.expected.name).toLowerCase() === 'date' && typeof gotItem === 'number') {
                                    newObject[arewethere] = gotItem;
                                } else {
                                    newObject[arewethere] = tpData.default;
                                }
                            } else {
                                newObject[arewethere] = gotItem;
                            }
                        } else if (tpData.extended) {
                            newObject[arewethere] = schemaData(tpData.extends as keyof typeof schemaExports, gotItem);
                        }
                    }
                }
            }
            newArray.push(newObject);
        }

        return newArray;
    }

    return data;
};

export default schemaData;

export { schemaData };