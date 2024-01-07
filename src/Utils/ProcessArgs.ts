import process from "node:process";

const processArgs = <T = string[]>(allowedArgs: T): { invalid: string[]; valid: T } => {
	const valid = [];
	const invalid = [];

	if (!Array.isArray(allowedArgs)) throw new TypeError("Allowed args must be an array.");

	for (const arg of process.argv) {
		const isArgRegex = /^--(?<args>[a-z]+)$/;

		if (isArgRegex.test(arg)) {
			const argName = isArgRegex.exec(arg)?.[1];

			if (!argName) {
				invalid.push(arg);

				continue;
			}

			if (allowedArgs.includes(argName)) {
				valid.push(argName);
			} else {
				invalid.push(argName);
			}
		} else {
			invalid.push(arg);
		}
	}

	return {
		invalid,
		valid: valid as T,
	};
};

export default processArgs;
