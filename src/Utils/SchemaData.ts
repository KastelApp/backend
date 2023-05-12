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
		const NewObject: { [key: string]: any } = {};

		for (const [key, value] of Object.entries(data)) {
			const Found = Object.entries(tp.data).find(([, val]) => val.name === key);

			if (!Found) continue;

			const [NewName, SchemaStuff] = Found;

			if (SchemaStuff.extended) {
				NewObject[NewName] = schemaData(SchemaStuff.extends, value);
			} else {
				NewObject[NewName] = value;
			}
		}

		return NewObject;
	}

	if (tp.type === Array) {
		const NewArray: any[] = [];

		for (const item of data) {
			if (typeof item === 'object') {
				const NewObject: { [key: string]: any } = {};

				for (const [key, value] of Object.entries(item)) {
					const Found = Object.entries(tp.data).find(([, val]) => val.name === key);

					if (!Found) continue;

					const [NewName, SchemaStuff] = Found;

					if (SchemaStuff.extended) {
						NewObject[NewName] = schemaData(SchemaStuff.extends, value);
					} else {
						NewObject[NewName] = value;
					}
				}
				
				NewArray.push(NewObject);
			}
		}
		
		return NewArray;
	}

	return data;
};

export default schemaData;

export { schemaData };
