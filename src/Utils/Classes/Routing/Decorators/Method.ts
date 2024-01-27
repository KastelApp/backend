import type { Method as RequestMethod, Route } from "../Route.ts";

// eslint-disable-next-line @typescript-eslint/naming-convention
const Method = (Method: RequestMethod) => {
	return (target: Route, propertyKey: string) => {
		target.__methods = [
			...(target.__methods ?? []),
			{
				method: Method,
				name: propertyKey,
			},
		];
	};
};

export default Method;
