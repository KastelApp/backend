import type { CreateRouteOptions, CreateMiddleware, Route } from "../Route.ts";

// eslint-disable-next-line @typescript-eslint/naming-convention
const Middleware = (ware: (req: CreateRouteOptions<string, {}>) => CreateMiddleware | Promise<CreateMiddleware>) => {
	return (target: Route, propertyKey: string) => {
		target.__middlewares = [
			...(target.__middlewares ?? []),
			{
				name: propertyKey,
				ware,
			},
		];
	};
};

export default Middleware;
