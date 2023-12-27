import process from "node:process";

const ProcessArgs = (allowedArgs: string[]): { Invalid: string[]; Valid: string[] } => {
	const Valid = [];
	const Invalid = [];

	if (!Array.isArray(allowedArgs)) throw new TypeError("Allowed args must be an array.");

	for (const Arg of process.argv) {
		const IsArgRegex = /^--(?<args>[a-z]+)$/;

		if (IsArgRegex.test(Arg)) {
			const ArgName = IsArgRegex.exec(Arg)?.[1];

			if (!ArgName) {
				Invalid.push(Arg);

				continue;
			}

			if (allowedArgs.includes(ArgName)) {
				Valid.push(ArgName);
			} else {
				Invalid.push(ArgName);
			}
		} else {
			Invalid.push(Arg);
		}
	}

	return {
		Invalid,
		Valid,
	};
};

export default ProcessArgs;
