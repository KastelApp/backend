import type { Route } from "../Route.ts";

// eslint-disable-next-line @typescript-eslint/naming-convention
const Description = (description: string) => {
	return (target: Route, propertyKey: string) => {
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
