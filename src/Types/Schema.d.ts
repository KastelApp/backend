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

import schemaExports from "../Utils/SchemaTypes/Exports";

interface SchemaDataOptionsBase {
  name: string;
  extended: true | false;
}

interface SchemaDataOptionsWithExtends extends SchemaDataOptionsBase {
  extended: true;
  extends: keyof typeof schemaExports;
}

interface SchemaDataOptionsWithoutExtends extends SchemaDataOptionsBase {
  extended: false;
  expected:
    | StringConstructor
    | BooleanConstructor
    | DateConstructor
    | ArrayConstructor
    | NumberConstructor;
  default: any;
}

type SchemaDataOptions =
  | SchemaDataOptionsWithExtends
  | SchemaDataOptionsWithoutExtends;

export interface Schema {
  type: ObjectConstructor | ArrayConstructor;
  data: {
    [key: string]: SchemaDataOptions;
  };
}