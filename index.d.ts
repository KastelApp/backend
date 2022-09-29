import * as SchemaExports from './src/utils/schemaTypes/exports';
import * as express from 'express'
import cache from './src/utils/classes/Cache'
export type SchemaTypes = keyof typeof SchemaExports

export type Schema = {
    type: ObjectConstructor | ArrayConstructor;
    data: {
        [key: string]: SchemaDataOptions;
    };
}

export type SchemaDataOptions = {
    name: string;
    expected: StringConstructor | BooleanConstructor | DateConstructor | ArrayConstructor | NumberConstructor;
    default?: any;
    extended?: boolean | undefined;
    extends?: string | undefined;
}

export type RouteItem = {
    path: string;
    regex: RegExp;
    method: Methods;
    run: RunCallBack;
    middleware: RunCallBack[] | function[];
    Route: Route;
}

export type Methods = 'all' | 'ALL' | 'get' | 'GET' | 'delete' | 'DELETE' | 'head' | 'HEAD' | 'options' | 'OPTIONS' | 'post' | 'POST' | 'put' | 'PUT' | 'patch' | 'PATCH' | 'purge' | 'PURGE' | ('get' | 'GET' | 'delete' | 'DELETE' | 'head' | 'HEAD' | 'options' | 'OPTIONS' | 'post' | 'POST' | 'put' | 'PUT' | 'patch' | 'PATCH' | 'purge' | 'PURGE' | 'all' | 'ALL')[]

export type RunCallBack = (req: express.Request, res: express.Response, next: express.NextFunction, redis: cache) => {}

declare global {
    
}

export {}