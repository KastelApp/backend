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
	cb: (args, _, repl) => {
		if (args.length === 0) {
			for (const Cmd of repl.cmds) {
				console.log(`${Logger.colorize("#f3432c", "Command:")} ${Cmd.name} - ${Cmd.description}`);

				for (const Arg of Cmd.args) {
					console.log(
						`${Logger.colorize("#f39d2c", "Argument:")} ${Arg.optional ? `[${Arg.name}]` : `<${Arg.name}>`} - ${
							Arg.description
						}`,
					);
				}

				for (const Flag of Cmd.flags) {
					console.log(
						`${Logger.colorize("#f3c12c", "Flag:")} ${Flag.optional ? `[${Flag.name}]` : `<${Flag.name}>`} - ${
							Flag.description
						}`,
					);
				}

				console.log("\n");
			}
		} else {
			const Cmd = repl.cmds.find((cmd) => cmd.name === args[0]);

			if (Cmd) {
				console.log(`${Logger.colorize("#f3432c", "Command:")} ${Cmd.name} - ${Cmd.description}`);

				for (const Arg of Cmd.args) {
					console.log(
						`${Logger.colorize("#f39d2c", "Argument:")} ${Arg.optional ? `[${Arg.name}]` : `<${Arg.name}>`} - ${
							Arg.description
						}`,
					);
				}

				for (const Flag of Cmd.flags) {
					console.log(
						`${Logger.colorize("#f3c12c", "Flag:")} ${Flag.optional ? `[${Flag.name}]` : `<${Flag.name}>`} - ${
							Flag.description
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

			const Booleans = {
				enter: key === "\u000D",
				backspace: key === "\u007F",
				tab: key === "\t",
				upKey: key === "\u001B\u005B\u0041",
				downKey: key === "\u001B\u005B\u0042",
			};

			if (!Booleans.enter && !Booleans.backspace && !Booleans.tab && !Booleans.upKey && !Booleans.downKey) {
				this.currentString += key;
			} else if (Booleans.backspace) {
				if (this.currentString.length === 0) {
					process.stdout.write("\u0007");
				} else {
					this.currentString = this.currentString.slice(0, -1);
				}
			} else if (Booleans.tab) {
				const NewStr = this.onTab() ?? this.currentString;

				this.currentString = NewStr;

				this.historyIndex = 0; // set it to 0 as this is now something new
			} else if (Booleans.enter) {
				const Command = this.getCmdName();

				console.log(`${this.start}${this.currentString}`);

				this.history.unshift(this.currentString);

				this.historyIndex = 0; // we set it to 0 because we just added a new item to the history

				const Cmd = this.cmds.find((cmd) => cmd.name === Command);

				if (!Cmd) {
					console.log(
						`Unknown command ${Command}${
							Command ? `, did you mean one of these? "${this.getSimilarCommands(Command ?? "").join('", "')}"` : "."
						}`,
					);
				}

				if (Cmd) {
					const Args = this.getArgs();
					const Flags = this.getFlags();

					const MissingArgs = Cmd.args.filter((arg) => !arg.optional && !Args.includes(arg.name));
					const MissingFlags = Cmd.flags.filter((flag) => !flag.optional && !Object.keys(Flags).includes(flag.name));
					const InvalidFlags = Cmd.flags.filter((flag) => {
						const FlagValue = Flags[flag.name];

						if (FlagValue === undefined) {
							return false;
						}

						if (
							(flag.value === "boolean" && typeof FlagValue !== "boolean") ||
							(flag.value === "string" && typeof FlagValue !== "string")
						) {
							return true;
						}

						return Boolean(
							typeof FlagValue === "string" &&
								((flag.minLength && FlagValue.length < flag.minLength) ||
									(flag.maxLength && FlagValue.length > flag.maxLength)),
						);
					});

					if (MissingArgs.length > 0) {
						console.log(`Missing arguments: ${MissingArgs.map((arg) => arg.name).join(", ")}`);
					}

					if (MissingFlags.length > 0) {
						console.log(`Missing flags: ${MissingFlags.map((flag) => flag.name).join(", ")}`);
					}

					if (InvalidFlags.length > 0) {
						console.log(`Invalid flags: ${InvalidFlags.map((flag) => flag.name).join(", ")}`);
					}

					if (MissingArgs.length === 0 && MissingFlags.length === 0) {
						Cmd.cb(Args, Flags, this);
					}
				}

				this.currentString = "";
			} else if (Booleans.upKey) {
				if (this.historyIndex === 0) {
					this.oldString = this.currentString;
				}

				if (this.historyIndex < this.history.length) {
					this.historyIndex++;
				}

				this.currentString = this.history[this.historyIndex - 1] ?? this.oldString;
			} else if (Booleans.downKey) {
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

		const OriginalConsole = console.log;

		const OverriteLogs = (message?: any, ...optionalParams: any[]) => {
			process.stdout.clearLine(0);
			process.stdout.cursorTo(0);

			OriginalConsole(message, ...optionalParams);

			process.stdout.write(this.start + this.currentString);
		};

		console.log = OverriteLogs;
		console.warn = OverriteLogs;
		console.error = OverriteLogs;
		console.info = OverriteLogs;
	}

	public onTab() {
		const IsTypingCommand = this.currentString.split(" ").length === 1;

		if (IsTypingCommand) {
			const Cmds = this.cmds.map((cmd) => cmd.name);
			const FilteredCmds = Cmds.filter((cmd) => cmd.startsWith(this.currentString));

			if (FilteredCmds.length === 0) {
				return this.currentString;
			}

			if (FilteredCmds.length === 1) {
				return FilteredCmds[0];
			}

			const MostMatching = FilteredCmds.sort((a, b) => {
				const AMatches = a.split("").filter((char, index) => char === this.currentString[index]).length;
				const BMatches = b.split("").filter((char, index) => char === this.currentString[index]).length;

				return BMatches - AMatches;
			});

			return MostMatching[0] ?? this.currentString;
		} else {
			const Command = this.getCmdName();

			if (!Command) {
				process.stdout.write("\u0007");

				return this.currentString;
			}

			const Cmd = this.cmds.find((cmd) => cmd.name === Command);

			if (!Cmd) {
				process.stdout.write("\u0007");

				return this.currentString;
			}

			const Flags = this.getFlags(true);

			const FlagNames = Object.keys(Flags);

			if (FlagNames.length === 0) {
				return this.currentString;
			}

			const FilteredFlags = Cmd.flags.filter((flag) => flag.name.startsWith(FlagNames[FlagNames.length - 1] ?? ""));

			if (FilteredFlags.length === 0) {
				return this.currentString;
			}

			if (FilteredFlags.length === 1) {
				const Flag = FilteredFlags[0];

				return `${this.currentString.slice(0, -(FlagNames[FlagNames?.length - 1]?.length ?? 0))}${Flag?.name}`;
			}

			const MostMatching = FilteredFlags.sort((a, b) => {
				const AMatches = a.name
					.split("")
					.filter((char, index) => char === FlagNames[FlagNames.length - 1]?.[index]).length;
				const BMatches = b.name
					.split("")
					.filter((char, index) => char === FlagNames[FlagNames.length - 1]?.[index]).length;

				return BMatches - AMatches;
			});

			const Flag = MostMatching[0];

			return `${this.currentString.slice(0, -(FlagNames[FlagNames?.length - 1]?.length ?? 0))}${Flag?.name}`;
		}
	}

	public getCurrentCommand() {
		const Args = this.getArgs();
		const Command = this.getCmdName();
		const Flags = this.getFlags();

		return {
			Command,
			Args,
			Flags,
		};
	}

	private getCmdName() {
		const Args = this.currentString.split(" ");

		return Args.shift();
	}

	private getFlags(raw: boolean = false) {
		const Flags: Record<string, boolean | string> = {};
		const CurrentCmdName = this.getCmdName();
		const Cmd = this.cmds.find((cmd) => cmd.name === CurrentCmdName);

		if (!Cmd) {
			return Flags;
		}

		const Regex = /--?(\w+)(?:\s+([\s\w]+))?/g;

		let Match;
		while ((Match = Regex.exec(this.currentString)) !== null) {
			const FlagName = Match[1] ?? "UNKNOWN";
			const FlagValue = Match[2]?.trim() ?? true;
			Flags[FlagName] = FlagValue;
		}

		if (raw) {
			return Flags;
		}

		const NewFlags: Record<string, boolean | string> = {};

		for (const FlagName in Flags) {
			// protects against prototype pollution
			if (["hasOwnProperty", "propertyIsEnumerable"].includes(FlagName)) {
				continue;
			}

			const Flag = Cmd.flags.find((flag) => flag.name === FlagName || flag.shortName === FlagName);

			if (Flag) {
				if (Flag.value === "string" && typeof Flags[FlagName] !== "string") {
					NewFlags[Flag.name] = "";
				} else if (Flag.value === "boolean" && typeof Flags[FlagName] !== "boolean") {
					NewFlags[Flag.name] = true;
				} else {
					NewFlags[Flag.name] = Flags[FlagName] ?? true;
				}
			}
		}

		return NewFlags;
	}

	private getArgs() {
		const Args = this.currentString.split(" ");
		const Cmd = this.cmds.find((cmd) => cmd.name === Args[0]);

		if (!Cmd) {
			return [];
		}

		Args.shift();

		return Args.filter((arg) => !arg.startsWith("--") && !arg.startsWith("-"));
	}

	private getSimilarCommands(command: string) {
		const Cmds = this.cmds.map((cmd) => cmd.name);
		const FilteredCmds = Cmds.filter((cmd) => cmd.startsWith(command));

		if (FilteredCmds.length === 0) {
			return [];
		}

		if (FilteredCmds.length === 1) {
			return FilteredCmds;
		}

		return FilteredCmds.sort((a, b) => {
			const AMatches = a.split("").filter((char, index) => char === command[index]).length;
			const BMatches = b.split("").filter((char, index) => char === command[index]).length;

			return BMatches - AMatches;
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
