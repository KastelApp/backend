import process from "node:process";

const ProcessArgs = (allowedArgs: string[]): { Invalid: string[]; Valid: string[] } => {
	const Valid = [];
	const Invalid = [];

	if (!Array.isArray(allowedArgs)) throw new TypeError("Allowed args must be an array.");

	for (const arg of process.argv) {
		const isArgRegex = /^--(?<args>[a-z]+)$/;

		if (isArgRegex.test(arg)) {
			const argName = isArgRegex.exec(arg)?.[1];

			if (!argName) {
				Invalid.push(arg);

				continue;
			}

			if (allowedArgs.includes(argName)) {
				Valid.push(argName);
			} else {
				Invalid.push(argName);
			}
		} else {
			Invalid.push(arg);
		}
	}

	return {
		Invalid,
		Valid,
	};
};

export default ProcessArgs;
