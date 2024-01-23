import type { Event } from "../Event.ts";

// eslint-disable-next-line @typescript-eslint/naming-convention
const AuthRequired = (isRequired: boolean = true) => {
	return (target: Event, propertyKey: string) => {
		target.__authRequired = [
			...(target.__authRequired ?? []),
			{
				name: propertyKey,
				auth: isRequired,
			},
		];
	};
};

export default AuthRequired;
