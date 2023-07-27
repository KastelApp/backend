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

import type schemaExports from '../Utils/SchemaTypes/Exports';

interface SchemaDataOptionsBase {
	extended: false | true;
	name: string;
}

interface SchemaDataOptionsWithExtends extends SchemaDataOptionsBase {
	extended: true;
	extends: keyof typeof schemaExports;
}

interface SchemaDataOptionsWithoutExtends extends SchemaDataOptionsBase {
	default: any;
	expected: ArrayConstructor | BooleanConstructor | DateConstructor | NumberConstructor | StringConstructor;
	extended: false;
}

type SchemaDataOptions = SchemaDataOptionsWithExtends | SchemaDataOptionsWithoutExtends;

export interface Schema {
	data: {
		[key: string]: SchemaDataOptions;
	};
	type: ArrayConstructor | ObjectConstructor;
}
