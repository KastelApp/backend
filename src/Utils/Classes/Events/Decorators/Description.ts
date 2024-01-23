import type { Event } from "../Event.ts";

// eslint-disable-next-line @typescript-eslint/naming-convention
const Description = (description: string) => {
	return (target: Event, propertyKey: string) => {
		target.__descriptions = [
			...(target.__descriptions ?? []),
			{
				name: propertyKey,
				description, // For example: "[GET] Fetch the user's avatar"
			},
		];
	};
};

export default Description;
