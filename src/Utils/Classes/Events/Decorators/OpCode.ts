import type { Event } from "../Event.ts";

// eslint-disable-next-line @typescript-eslint/naming-convention
const OpCode = (code: number) => {
	return (target: Event, propertyKey: string) => {
		target.__opcodes = [
			...(target.__opcodes ?? []),
			{
				name: propertyKey,
				code,
			},
		];
	};
};

export default OpCode;
