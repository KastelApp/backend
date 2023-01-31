interface SchemaDataOptionsBase {
  name: string;
  extended: true | false;
}

interface SchemaDataOptionsWithExtends extends SchemaDataOptionsBase {
  extended: true;
  extends: string;
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
