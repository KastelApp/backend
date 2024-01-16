// TODO: Finish the OpenSpec file, this is a WIP

import { join } from "node:path";
import { URL } from "node:url";
import type { Type } from "ts-morph";
import { ModuleKind, ModuleResolutionKind, NewLineKind, Project, ScriptTarget, TypeFlags, ts } from "ts-morph";
import { ModuleDetectionKind } from "typescript";
import FileSystemRouter from "./Utils/Classes/FileSystemRouter.ts";
import Route from "./Utils/Classes/Routing/Route.ts";

const router = new FileSystemRouter({
    dir: join(new URL(".", import.meta.url).pathname, "./Routes"),
    style: "nextjs",
    watch: false
});

const project = new Project({
    compilerOptions: {
        "allowUnreachableCode": false,
        "allowUnusedLabels": false,
        "exactOptionalPropertyTypes": true,
        "noFallthroughCasesInSwitch": true,
        "noImplicitOverride": true,
        "noImplicitReturns": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "strict": true,
        "useUnknownInCatchVariables": true,
        "noUncheckedIndexedAccess": true,
        "module": ModuleKind.ESNext,
        "moduleResolution": ModuleResolutionKind.Bundler,
        "resolveJsonModule": true,
        "declaration": true,
        "declarationMap": true,
        "importHelpers": true,
        "inlineSources": true,
        "newLine": NewLineKind.LineFeed,
        "noEmitHelpers": true,
        "outDir": "dist",
        "removeComments": false,
        "sourceMap": true,
        "esModuleInterop": true,
        "forceConsistentCasingInFileNames": true,
        "experimentalDecorators": true,
        "lib": ["esnext"],
        "target": ScriptTarget.ESNext,
        "useDefineForClassFields": true,
        "types": ["bun-types"],
        "skipLibCheck": true,
        "allowJs": true,
        "noEmit": true,
        "allowImportingTsExtensions": true,
        "moduleDetection": ModuleDetectionKind.Force,
        "noErrorTruncation": true, // darkerink: this is just so I can see the full types
        "paths": {
            "@/*": ["./src/*"]
        }
    }
});

const allowedMethods = ["get", "post", "put", "patch", "delete", "head", "options"];
const typechecker = project.getTypeChecker();

const serializeTypeToJson = (returnType: Type<ts.Type>): any => {
    // console.log(returnType.getFlags());

    if (returnType.getFlags() & TypeFlags.Object && !returnType.isArray()) {
        const obj: Record<string, unknown> = {};

        for (const prop of returnType.getProperties()) {
            if (!prop.getValueDeclaration()) {
                continue;
            }

            obj[prop.getName()] = serializeTypeToJson(typechecker.getTypeOfSymbolAtLocation(prop, prop.getValueDeclaration()!));
        }

        return obj;
    } else if (returnType.getFlags() & TypeFlags.Union) {
        const types = returnType.getUnionTypes();

        return types.map(type => serializeTypeToJson(type));
    } else if (returnType.getFlags() & TypeFlags.Intersection) {
        const types = returnType.getIntersectionTypes();

        return types.map(type => serializeTypeToJson(type));
    } else if (returnType.getFlags() & TypeFlags.String) {
        return "string";
    } else if (returnType.getFlags() & TypeFlags.Number) {
        return "number";
    } else if (returnType.getFlags() & TypeFlags.Boolean) {
        return "boolean";
    } else if (returnType.getFlags() & TypeFlags.Any) {
        return "any";
    } else if (returnType.getFlags() & TypeFlags.Unknown) {
        return "unknown";
    } else if (returnType.getFlags() & TypeFlags.Null) {
        return "null";
    } else if (returnType.getFlags() & TypeFlags.Undefined) {
        return "undefined";
    } else if (returnType.getFlags() & TypeFlags.Void) {
        return "void";
    } else if (returnType.getFlags() & TypeFlags.Never) {
        return "never";
    } else if (returnType.getFlags() & TypeFlags.BigInt) {
        return "bigint";
    } else if (returnType.getFlags() & TypeFlags.Object && returnType.isArray()) {
        const typeArgs = returnType.getTypeArguments();

        if (typeArgs.length === 1) {
            return [serializeTypeToJson(typeArgs[0]!)];
        }

        return [];
    } else if (returnType.getFlags() & TypeFlags.BooleanLiteral) {
        return returnType.getText();
    } else if (returnType.getFlags() & TypeFlags.StringLiteral) {
        return returnType.getText().replaceAll('"', "");
    }

    console.warn("Unknown type", returnType.getFlags(), returnType.getText());

    return "unknown";
};

const getErrors = (str: string) => {
    // Remove trailing commas
    const cleanedString = str.replaceAll(/,\s*}/g, "}").replaceAll(/,\s*]/g, "]");

    // Match the login object
    const regex = /{\s*(?<code>[\w$]+)\s*:\s*{(?<message>[^}]+)}\s*}/;
    const match = regex.exec(cleanedString);

    if (match) {
        const objName = match[1];

        // Match code and message within the login object
        const codeRegex = /code:\s*"(?<code>[^"]+)"/;
        const messageRegex = /message:\s*"(?<message>[^"]+)"/;

        const codeMatch = match[2]?.match(codeRegex);
        const messageMatch = match[2]?.match(messageRegex);

        if (codeMatch && messageMatch) {
            const code = codeMatch[1];
            const message = messageMatch[1];

            return { objName, code, message };
        } else {
            return null;
        }
    }

    return null;
};

const dd = [];

for (const [name, route] of Object.entries(router.routes)) {
    const routeClass = await import(route);

    if (!routeClass.default) {
        throw new Error(`Route ${name} does not have a default export, cannot generate spec`);
    }

    const routeInstance = new routeClass.default(); // Nothing gets ran so we don't need to provide an "App"

    if (!(routeInstance instanceof Route)) {
        throw new TypeError(`Route ${name} is not an instance of Route, cannot generate spec`);
    }

    // console.log("Route", name, routeClass.default.name);
    // console.log("Methods", routeInstance.__methods);
    // console.log("Middlewares", routeInstance.__middlewares);
    // console.log("Content Types", routeInstance.__contentTypes);
    // console.log("Descriptions", routeInstance.__descriptions);

    project.addSourceFileAtPath(route);

    const source = project.getSourceFileOrThrow(route);
    const classes = source.getClasses()[0]!;

    if (classes.getExtends()?.getText() !== "Route") {
        throw new Error(`Route ${name} does not extend Route, cannot generate spec`);
    }

    const methods = classes.getMethods();

    const filtered = methods.filter(method => {
        const decorators = method.getDecorators();
        const decs = decorators?.map(dec => dec.getText());
        const methodDec = decs?.find(dec => dec.includes("Method"));
        const args = decorators.map(dec => dec.getArguments().map(arg => arg.getText().replaceAll('"', "")));

        if (!methodDec) return false;

        return Boolean(args.some(arg => arg.some(a => allowedMethods.includes(a))));
    });

    const returnTypes = filtered.map(method => {
        if (method.getReturnType().getText().includes("Promise")) {
            const typeArgs = method.getReturnType().getTypeArguments();

            // get any "addError" method calls that are inside the method
            const addErrorCalls = method.getDescendantsOfKind(ts.SyntaxKind.CallExpression).filter(call => {
                const exp = call.getExpression();
                const expName = exp?.getText();

                return expName.endsWith("addError");
            });

            // filter duplicates (same error code and objName)
            const errorArgs = addErrorCalls.map(call => {
                const args = call.getArguments();
                return args[0]!.getText();
            }).map(getErrors).filter(Boolean).filter((error, index, self) => {
                return self.findIndex(e => e?.code === error?.code && e?.objName === error?.objName) === index;
            });

            return {
                type: "Promise",
                methodName: method.getName(),
                description: routeInstance.__descriptions.find(desc => desc.name === method.getName())?.description ?? "",
                method: routeInstance.__methods.find(meth => meth.name === method.getName())?.method ?? "get",
                returnType: serializeTypeToJson(typeArgs[0]!),
                errors: errorArgs,
            };
        }

        const addErrorCalls = method.getDescendantsOfKind(ts.SyntaxKind.CallExpression).filter(call => {
            const exp = call.getExpression();
            const expName = exp?.getText();

            return expName === "error.addError";
        });

        const errorArgs = addErrorCalls.map(call => {
            const args = call.getArguments();
            return args[0]!.getText();
        }).map(getErrors).filter(Boolean).filter((error, index, self) => {
            return self.findIndex(e => e?.code === error?.code && e?.objName === error?.objName) === index;
        });

        // middleware

        return {
            type: "NonPromise",
            name: method.getName(),
            description: routeInstance.__descriptions.find(desc => desc.name === method.getName())?.description ?? "",
            method: routeInstance.__methods.find(meth => meth.name === method.getName())?.method ?? "get",
            returnType: serializeTypeToJson(method.getReturnType()),
            errors: errorArgs,
        };
    });

    dd.push({
        types: returnTypes,
        name
    });
}

await Bun.write("./test.json", JSON.stringify(dd.reverse(), null, 4));

// eslint-disable-next-line n/prefer-global/process
process.exit(0);
