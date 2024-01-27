import process from "node:process";

const processArgs = <T extends string>(allowedArgs: T[]): { invalid: (T | string)[]; valid: T[] } => {
	const valid: T[] = [];
	const invalid: T[] = [];

	if (!Array.isArray(allowedArgs)) throw new TypeError("Allowed args must be an array.");

	for (const arg of process.argv) {
		const isArgRegex = /^--(?<args>[a-z]+)$/;

		if (isArgRegex.test(arg)) {
			const argName = isArgRegex.exec(arg)?.[1];

			if (!argName) {
				invalid.push(arg as T);

				continue;
			}

			if (allowedArgs.includes(argName as T)) {
				valid.push(argName as T);
			} else {
				invalid.push(argName as T);
			}
		} else {
			invalid.push(arg as T);
		}
	}

	return {
		invalid,
		valid,
	};
};

interface ProcessArg {
	default?: boolean | number | string;
	name: string;
	newName?: string;
	// ? boolean only requires the name, does not require a value
	optional?: boolean;
	type: "boolean" | "number" | "string" | "string[]";
}

const newprocessArgs = <T extends ProcessArg>(args: T[]) => {
	const parsedArgs: Record<string, string[] | boolean | number | string> = {};

	const argv = process.argv.slice(2);
	
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		const currentArg = args.find((a) => `--${a.name}` === arg);

		if (currentArg) {
			const nextArg = argv[i + 1];

			if (currentArg.type === "boolean") {
				parsedArgs[currentArg.newName ?? currentArg.name] = nextArg ? nextArg?.startsWith("--")
					? true
					: JSON.parse(nextArg ?? "false") : true;
			} else if (nextArg && !nextArg.startsWith("--")) {
				if (currentArg.type === "number") {
					parsedArgs[currentArg.newName ?? currentArg.name] = Number.parseFloat(nextArg);
				} else if (currentArg.type === "string[]") {
					parsedArgs[currentArg.newName ?? currentArg.name] = nextArg.split(",");
				} else {
					parsedArgs[currentArg.newName ?? currentArg.name] = nextArg;
				}

				i++; // Skip the next arg since it has been processed
			} else {
				throw new Error(`Value missing for argument: ${currentArg.name}`);
			}
		}
	}

	for (const arg of args) {
		if (arg.optional && parsedArgs[arg.newName ?? arg.name] === undefined) {
			// @ts-expect-error -- null
			parsedArgs[arg.newName ?? arg.name] = arg.default ?? null;
		} else if (parsedArgs[arg.newName ?? arg.name] === undefined) {
			if (arg.default) {
				parsedArgs[arg.newName ?? arg.name] = arg.default;
				continue;
			}

			throw new Error(`Argument: ${arg.name} is required`);
		}
	}

	return parsedArgs;
};

export default processArgs;

export { newprocessArgs };
