import type { BodyValidator } from "@/Types/BodyValidation.ts";
import errorGen from "@/Utils/Classes/ErrorGen.ts";
import type { CreateMiddleware, CreateRoute } from "@/Utils/Classes/Routing/Route.ts";

const isBodyValidator = (value: any): value is BodyValidator => {
	return typeof value === "object" && !("validate" in value);
};

// TODO: oh god we need to rewrite this, it works but the code.. its... omg ew (NOTE: I made this at midnight/2am - DarkerInk)

const validate = (
	errors: {
		code: "invalid" | "missing";
		expected?: string;
		key: string;
		msg?: string | null;
		received?: string;
	}[],
	body: Record<string, unknown>,
	value: BodyValidator,
	fullKey?: string,
) => {
	const newErrors = errors;

	for (const [key, validator] of Object.entries(value)) {
		if (isBodyValidator(validator)) {
			newErrors.push(
				...validate(
					newErrors,
					(body[key] as Record<string, unknown>) ?? {},
					validator,
					fullKey ? `${fullKey}.${key}` : key,
				),
			);
		} else if ("validate" in validator) {
			const validated = validator.validate(body[key]);

			if (!validated.valid) {
				if (validated.multiErrors) {
					for (const error of validated.multiErrors) {
						if (error.multiErrors) {
							for (const secondError of error.multiErrors) {
								newErrors.push({
									code: "invalid",
									key: fullKey
										? `${fullKey}.${key}[${error.pos}].${error.key}${secondError.pos === -1 ? "" : `[${secondError.pos}]`}.${secondError.key}`
										: `${key}[${error.pos}].${error.key}${secondError.pos === -1 ? "" : `[${secondError.pos}]`}.${secondError.key}`,
									expected: validator.type,
									msg: secondError.error,
								});
							}
						} else {
							newErrors.push({
								code: "invalid",
								key: fullKey
									? `${fullKey}.${key}${error.pos === -1 ? "" : `[${error.pos}]`}.${error.key}`
									: `${key}${error.pos === -1 ? "" : `[${error.pos}]`}.${error.key}`,
								expected: validator.type,
								msg: error.error,
							});
						}
					}
				} else if (validator.required && body[key] === undefined) {
					newErrors.push({
						code: "missing",
						key: fullKey ? `${fullKey}.${key}` : key,
						expected: validator.type,
						msg: validated.error ? validated.error.replace("{key}", fullKey ? `${fullKey}.${key}` : key) : null,
					});
				} else {
					newErrors.push({
						code: "invalid",
						key: fullKey ? `${fullKey}.${key}` : key,
						expected: validator.type,
						received: body[key] === null ? "null" : typeof body[key],
						msg: validated.error ? validated.error.replace("{key}", fullKey ? `${fullKey}.${key}` : key) : null,
					});
				}
			}
		}
	}

	return newErrors;
};

const bodyValidator = (options: BodyValidator) => {
	return ({ body, set }: CreateRoute<string, Record<string, string>>): CreateMiddleware<Record<string, unknown>> => {
		const errors = validate([], body, options);

		if (errors.length > 0) {
			set.status = 400;

			const error = errorGen.InvalidField();

			for (const err of errors) {
				error.addError({
					[err.key]: {
						code: err.code === "invalid" ? "InvalidType" : "MissingField",
						message: err.msg
							? err.msg
							: err.code === "invalid"
								? `${err.key} was invalid, expected type was ${err.expected}, received type was ${err.received}`
								: `${err.key} was missing, expected type was ${err.expected}`,
					},
				});
			}

			return error.toJSON();
		}

		return {};
	};
};

export default bodyValidator;

export { validate }
