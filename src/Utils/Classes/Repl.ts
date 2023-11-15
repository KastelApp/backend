/* eslint-disable prefer-named-capture-group */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable promise/prefer-await-to-callbacks */
/* eslint-disable n/prefer-global/process */

import Logger from "./Logger.ts";

interface Command {
	// like waffles syrup butter
	args: {
		description: string;
		name: string;
		optional?: boolean;
	}[];
	cb(args: string[], flags: Record<string, boolean | string>, repl: Repl): void;
	description: string;
	// these are --flag <value> (or --flag for a boolean)
	flags: {
		description: string;
		maxLength?: number;
		minLength?: number;
		name: string;
		optional?: boolean;
		shortName: string;
		value: "boolean" | "string";
	}[];
	name: string;
}

const BuiltInHelp: Command = {
	name: "help",
	description: "Shows info about the repl & commands",
	args: [
		{
			name: "command",
			description: "Get more specific info about a command",
			optional: true,
		},
	],
	flags: [],
	cb(args, _, repl) {
		if (args.length === 0) {
			for (const cmd of repl.cmds) {
				console.log(`${Logger.colorize("#f3432c", "Command:")} ${cmd.name} - ${cmd.description}`);

				for (const arg of cmd.args) {
					console.log(
						`${Logger.colorize("#f39d2c", "Argument:")} ${arg.optional ? `[${arg.name}]` : `<${arg.name}>`} - ${
							arg.description
						}`,
					);
				}

				for (const flag of cmd.flags) {
					console.log(
						`${Logger.colorize("#f3c12c", "Flag:")} ${flag.optional ? `[${flag.name}]` : `<${flag.name}>`} - ${
							flag.description
						}`,
					);
				}

				console.log("\n");
			}
		} else {
			const cmd = repl.cmds.find((cmd) => cmd.name === args[0]);

			if (cmd) {
				console.log(`${Logger.colorize("#f3432c", "Command:")} ${cmd.name} - ${cmd.description}`);

				for (const arg of cmd.args) {
					console.log(
						`${Logger.colorize("#f39d2c", "Argument:")} ${arg.optional ? `[${arg.name}]` : `<${arg.name}>`} - ${
							arg.description
						}`,
					);
				}

				for (const flag of cmd.flags) {
					console.log(
						`${Logger.colorize("#f3c12c", "Flag:")} ${flag.optional ? `[${flag.name}]` : `<${flag.name}>`} - ${
							flag.description
						}`,
					);
				}

				console.log("\n");
			} else {
				console.log(`Unknown command ${args[0]}`);
			}
		}

		console.log("<item> - required\n[item] - optional");
	},
};

class Repl {
	public start: string; // the start of the repl

	public currentString: string; // the current string

	public originalConsoleLog: typeof console.log;

	public cmds: Command[];

	public history: string[];

	public historyIndex: number;

	public oldString: string;

	public constructor(start: string, cmds: Command[]) {
		this.start = start;

		process.stdin.setRawMode(true);
		process.stdin.setEncoding("utf8");

		this.currentString = "";

		this.originalConsoleLog = console.log;

		this.cmds = [BuiltInHelp, ...cmds];

		this.history = [];

		this.historyIndex = 0; // where we are at, if its 0 it means the current string = currentString

		this.oldString = "";
	}

	public startRepl() {
		process.stdin.on("data", (key: string) => {
			if (key === "\u0003") {
				process.exit();
			}

			const booleans = {
				enter: key === "\u000D",
				backspace: key === "\u007F",
				tab: key === "\t",
				upKey: key === "\u001B\u005B\u0041",
				downKey: key === "\u001B\u005B\u0042",
			};

			if (!booleans.enter && !booleans.backspace && !booleans.tab && !booleans.upKey && !booleans.downKey) {
				this.currentString += key;
			} else if (booleans.backspace) {
				if (this.currentString.length === 0) {
					process.stdout.write("\u0007");
				} else {
					this.currentString = this.currentString.slice(0, -1);
				}
			} else if (booleans.tab) {
				const newStr = this.onTab() ?? this.currentString;

				this.currentString = newStr;

				this.historyIndex = 0; // set it to 0 as this is now something new
			} else if (booleans.enter) {
				const command = this.getCmdName();

				console.log(`${this.start}${this.currentString}`);

				this.history.unshift(this.currentString);

				this.historyIndex = 0; // we set it to 0 because we just added a new item to the history

				const cmd = this.cmds.find((cmd) => cmd.name === command);

				if (!cmd) {
					console.log(
						`Unknown command ${command}${
							command ? `, did you mean one of these? "${this.getSimilarCommands(command ?? "").join('", "')}"` : "."
						}`,
					);
				}

				if (cmd) {
					const args = this.getArgs();
					const flags = this.getFlags();

					const missingArgs = cmd.args.filter((arg) => !arg.optional && !args.includes(arg.name));
					const missingFlags = cmd.flags.filter((flag) => !flag.optional && !Object.keys(flags).includes(flag.name));
					const invalidFlags = cmd.flags.filter((flag) => {
						const flagValue = flags[flag.name];

						if (flagValue === undefined) {
							return false;
						}

						if (
							(flag.value === "boolean" && typeof flagValue !== "boolean") ||
							(flag.value === "string" && typeof flagValue !== "string")
						) {
							return true;
						}

						return Boolean(
							typeof flagValue === "string" &&
								((flag.minLength && flagValue.length < flag.minLength) ||
									(flag.maxLength && flagValue.length > flag.maxLength)),
						);
					});

					if (missingArgs.length > 0) {
						console.log(`Missing arguments: ${missingArgs.map((arg) => arg.name).join(", ")}`);
					}

					if (missingFlags.length > 0) {
						console.log(`Missing flags: ${missingFlags.map((flag) => flag.name).join(", ")}`);
					}

					if (invalidFlags.length > 0) {
						console.log(`Invalid flags: ${invalidFlags.map((flag) => flag.name).join(", ")}`);
					}

					if (missingArgs.length === 0 && missingFlags.length === 0) {
						cmd.cb(args, flags, this);
					}
				}

				this.currentString = "";
			} else if (booleans.upKey) {
				if (this.historyIndex === 0) {
					this.oldString = this.currentString;
				}

				if (this.historyIndex < this.history.length) {
					this.historyIndex++;
				}

				this.currentString = this.history[this.historyIndex - 1] ?? this.oldString;
			} else if (booleans.downKey) {
				if (this.historyIndex > 0) {
					this.historyIndex--;
				}

				this.currentString = this.history[this.historyIndex - 1] ?? this.oldString;
			}

			process.stdout.clearLine(0);
			process.stdout.cursorTo(0);
			process.stdout.write(this.start + this.currentString);
		});

		process.stdout.write(this.start);

		const originalConsole = console.log;

		const overriteLogs = (message?: any, ...optionalParams: any[]) => {
			process.stdout.clearLine(0);
			process.stdout.cursorTo(0);

			originalConsole(message, ...optionalParams);

			process.stdout.write(this.start + this.currentString);
		};

		console.log = overriteLogs;
		console.warn = overriteLogs;
		console.error = overriteLogs;
		console.info = overriteLogs;
	}

	public onTab() {
		const isTypingCommand = this.currentString.split(" ").length === 1;

		if (isTypingCommand) {
			const cmds = this.cmds.map((cmd) => cmd.name);
			const filteredCmds = cmds.filter((cmd) => cmd.startsWith(this.currentString));

			if (filteredCmds.length === 0) {
				return this.currentString;
			}

			if (filteredCmds.length === 1) {
				return filteredCmds[0];
			}

			const mostMatching = filteredCmds.sort((a, b) => {
				const aMatches = a.split("").filter((char, index) => char === this.currentString[index]).length;
				const bMatches = b.split("").filter((char, index) => char === this.currentString[index]).length;

				return bMatches - aMatches;
			});

			return mostMatching[0] ?? this.currentString;
		} else {
			const command = this.getCmdName();

			if (!command) {
				process.stdout.write("\u0007");

				return this.currentString;
			}

			const cmd = this.cmds.find((cmd) => cmd.name === command);

			if (!cmd) {
				process.stdout.write("\u0007");

				return this.currentString;
			}

			const flags = this.getFlags(true);

			const flagNames = Object.keys(flags);

			if (flagNames.length === 0) {
				return this.currentString;
			}

			const filteredFlags = cmd.flags.filter((flag) => flag.name.startsWith(flagNames[flagNames.length - 1] ?? ""));

			if (filteredFlags.length === 0) {
				return this.currentString;
			}

			if (filteredFlags.length === 1) {
				const flag = filteredFlags[0];

				return `${this.currentString.slice(0, -(flagNames[flagNames?.length - 1]?.length ?? 0))}${flag?.name}`;
			}

			const mostMatching = filteredFlags.sort((a, b) => {
				const aMatches = a.name
					.split("")
					.filter((char, index) => char === flagNames[flagNames.length - 1]?.[index]).length;
				const bMatches = b.name
					.split("")
					.filter((char, index) => char === flagNames[flagNames.length - 1]?.[index]).length;

				return bMatches - aMatches;
			});

			const flag = mostMatching[0];

			return `${this.currentString.slice(0, -(flagNames[flagNames?.length - 1]?.length ?? 0))}${flag?.name}`;
		}
	}

	public getCurrentCommand() {
		const args = this.getArgs();
		const command = this.getCmdName();
		const flags = this.getFlags();

		return {
			command,
			args,
			flags,
		};
	}

	private getCmdName() {
		const args = this.currentString.split(" ");

		return args.shift();
	}

	private getFlags(raw: boolean = false) {
		const flags: Record<string, boolean | string> = {};
		const currentCmdName = this.getCmdName();
		const cmd = this.cmds.find((cmd) => cmd.name === currentCmdName);

		if (!cmd) {
			return flags;
		}

		const regex = /--?(\w+)(?:\s+([\s\w]+))?/g;

		let match;
		while ((match = regex.exec(this.currentString)) !== null) {
			const flagName = match[1] ?? "UNKNOWN";
			const flagValue = match[2]?.trim() ?? true;
			flags[flagName] = flagValue;
		}

		if (raw) {
			return flags;
		}

		const newFlags: Record<string, boolean | string> = {};

		for (const flagName in flags) {
			// protects against prototype pollution
			if (["hasOwnProperty", "propertyIsEnumerable"].includes(flagName)) {
				continue;
			}

			const flag = cmd.flags.find((flag) => flag.name === flagName || flag.shortName === flagName);

			if (flag) {
				if (flag.value === "string" && typeof flags[flagName] !== "string") {
					newFlags[flag.name] = "";
				} else if (flag.value === "boolean" && typeof flags[flagName] !== "boolean") {
					newFlags[flag.name] = true;
				} else {
					newFlags[flag.name] = flags[flagName] ?? true;
				}
			}
		}

		return newFlags;
	}

	private getArgs() {
		const args = this.currentString.split(" ");
		const cmd = this.cmds.find((cmd) => cmd.name === args[0]);

		if (!cmd) {
			return [];
		}

		args.shift();

		return args.filter((arg) => !arg.startsWith("--") && !arg.startsWith("-"));
	}

	private getSimilarCommands(command: string) {
		const cmds = this.cmds.map((cmd) => cmd.name);
		const filteredCmds = cmds.filter((cmd) => cmd.startsWith(command));

		if (filteredCmds.length === 0) {
			return [];
		}

		if (filteredCmds.length === 1) {
			return filteredCmds;
		}

		return filteredCmds.sort((a, b) => {
			const aMatches = a.split("").filter((char, index) => char === command[index]).length;
			const bMatches = b.split("").filter((char, index) => char === command[index]).length;

			return bMatches - aMatches;
		});
	}

	public endRepl() {
		process.stdin.removeAllListeners("data");
		process.stdin.setRawMode(false);
		process.stdin.setEncoding("utf8");

		console.log = this.originalConsoleLog;
	}
}

export default Repl;

export { Repl, type Command };
