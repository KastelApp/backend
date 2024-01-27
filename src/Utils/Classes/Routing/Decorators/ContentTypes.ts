import type { ContentTypes as RequestContentTypes, Route } from "../Route.ts";

// eslint-disable-next-line @typescript-eslint/naming-convention
const ContentTypes = (ContentTypes: RequestContentTypes | RequestContentTypes[]) => {
	return (target: Route, propertyKey: string) => {
		target.__contentTypes = [
			...(target.__contentTypes ?? []),
			{
				type: Array.isArray(ContentTypes) ? ContentTypes : [ContentTypes],
				name: propertyKey,
			},
		];
	};
};

export default ContentTypes;
