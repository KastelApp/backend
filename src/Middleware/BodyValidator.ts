import type { BodyValidator } from "@/Types/BodyValidation.ts";
import errorGen from "@/Utils/Classes/ErrorGen.ts";
import type { CreateMiddleware, CreateRoute } from "@/Utils/Classes/Routing/Route.ts";

const isBodyValidator = (value: any): value is BodyValidator => {
	return typeof value === "object" && !("validate" in value);
};

const validate = (
	errors: {
		code: "invalid" | "missing";
		expected?: string;
		key: string;
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
		} else if (typeof validator === "object" && "validate" in validator) {
			const valid = validator.validate(body[key]);

			if (!valid) {
				if (validator.required && body[key] === undefined) {
					newErrors.push({
						code: "missing",
						key: fullKey ? `${fullKey}.${key}` : key,
						expected: validator.type,
					});
				} else {
					newErrors.push({
						code: "invalid",
						key: fullKey ? `${fullKey}.${key}` : key,
						expected: validator.type,
						received: body[key] === null ? "null" : typeof body[key],
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
				error.AddError({
					[err.key]: {
						code: err.code === "invalid" ? "InvalidType" : "MissingField",
						message:
							err.code === "invalid"
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
