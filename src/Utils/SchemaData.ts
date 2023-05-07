/* eslint-disable valid-typeof */ // we disable this rule as we cannot do typeof on some stuff without more useless checks (like array)

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

import type { Schema } from '../Types/Schema';
import schemaExports from './SchemaTypes/Exports.js';

const schemaData = (type: keyof typeof schemaExports, data: any): any => {
	const tp: Schema = schemaExports[type];

	if (!tp) {
		throw new Error(`Unknown Type: ${type}`);
	}

	if (typeof data !== tp.type.name.toLowerCase() && !(data instanceof tp.type)) {
		throw new TypeError(
			`${type} Expected ${tp.type.name} got ${data === null ? 'Null' : typeof data}\n\nData Dump: ${JSON.stringify(
				data,
				null,
				4,
			)}`,
		);
	}

	if (tp.type === Object && Array.isArray(data)) {
		throw new TypeError(`${type} Expected ${tp.type.name} got Array`);
	}

	if (tp.type === Object) {
		const newObject: { [key: string]: any } = {};

		for (const [item, tpData] of Object.entries(tp.data)) {
			if (!tpData) {
				throw new Error(`Couldn't find ${item} in ${type}`);
			}

			const gotItem = data[tpData.name];

			if (tpData.extended) {
				newObject[item] = schemaData(tpData.extends, gotItem);
			} else if (typeof gotItem !== tpData.expected.name.toLowerCase() && !(gotItem instanceof tpData.expected)) {
				newObject[item] =
					tpData.expected.name.toLowerCase() === 'date' && typeof gotItem === 'number' ? gotItem : tpData.default;
			} else {
				newObject[item] = gotItem;
			}
		}

		return newObject;
	}

	if (tp.type === Array) {
		const newArray: any[] = [];

		for (const item of data) {
			const newObject: { [key: string]: any } = {};

			for (const [key, tpData] of Object.entries(tp.data)) {
				if (!tpData) {
					throw new Error(`Couldn't find ${key} in ${type}`);
				}

				if (tpData.name === key) {
					const gotItem = item[key];
					const arewethere = tp?.data?.[key]?.name ?? key;

					if (tpData.extended) {
						newObject[arewethere] = schemaData(tpData.extends, gotItem);
					} else if (typeof gotItem !== tpData.expected.name.toLowerCase() && !(gotItem instanceof tpData.expected)) {
						newObject[arewethere] =
							tpData.expected.name.toLowerCase() === 'date' && typeof gotItem === 'number' ? gotItem : tpData.default;
					} else {
						newObject[arewethere] = gotItem;
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
