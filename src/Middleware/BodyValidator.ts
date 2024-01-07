import type { BodyValidator } from "@/Types/BodyValidation.ts";
import type App from "@/Utils/Classes/App.ts";
import { ErrorGen } from "@/Utils/Classes/ErrorGen.ts";
import type { CreateMiddleware, CreateRoute } from "@/Utils/Classes/Routing/Route.ts";
import t from "@/Utils/TypeCheck.ts";

const validate = (options: BodyValidator[], body: Record<string, any>, app: App) => {
	const failedKeys: {
		key: string;
		messageKey?: string;
		type: "missing" | "too-long" | "too-short" | "wrong-type";
	}[] = [];

	for (const option of options) {
		const foundKey = body[option.key];

		if (option.required && foundKey === undefined) {
			failedKeys.push({
				key: option.key,
				type: "missing",
			});

			continue;
		}

		if (option.nullable && foundKey === null) continue;

		if (foundKey === undefined) continue;

		if (option.type === "complex") {
			const failed = validate(option.body ?? [], foundKey, app);

			if (failed.length > 0) {
				failedKeys.push(
					...failed.map((failed) => ({
						...failed,
						messageKey: `${option.key}.${failed.key}`,
					})),
				);
			}

			continue;
		}

		if (option.type === "snowflake") {
			if (!t(foundKey, "string")) {
				failedKeys.push({
					key: option.key,
					type: "wrong-type",
				});

				continue;
			}

			if (option.mustBeValid && !app.Snowflake.Validate(foundKey)) {
				failedKeys.push({
					key: option.key,
					type: "wrong-type",
				});
			}

			continue;
		}

		if (option.type === "number") {
			if (!t(foundKey, "number")) {
				failedKeys.push({
					key: option.key,
					type: "wrong-type",
				});

				continue;
			}

			if (option.max && foundKey > option.max) {
				failedKeys.push({
					key: option.key,
					type: "too-long",
				});
			}

			if (option.min && foundKey < option.min) {
				failedKeys.push({
					key: option.key,
					type: "too-short",
				});
			}

			continue;
		}

		if (!t(foundKey, option.type)) {
			failedKeys.push({
				key: option.key,
				type: "wrong-type",
			});
		}
	}

	return failedKeys;
};

const getErrorMessages = (
	failedKey: {
		key: string;
		messageKey?: string;
		type: "missing" | "too-long" | "too-short" | "wrong-type";
	},
	options: BodyValidator[],
) => {
	const option = options.find((option) => option.key === failedKey.key);

	if (!option)
		return {
			code: "InvalidFieldType",
			message: `Expected ${failedKey.key} to be ${failedKey.type} but it was missing`,
		};

	if (failedKey.type === "missing") {
		return {
			code: "MissingField",
			message: `Expected ${failedKey.key} to be ${option.type} but it was missing`,
		};
	}

	if ((failedKey.type === "too-long" || failedKey.type === "too-short") && option.type === "number") {
		return {
			code: failedKey.type === "too-long" ? "NumberTooLong" : "NumberTooShort",
			message: `${failedKey.key} must be between ${option.min} and ${option.max} but it was ${
				failedKey.type === "too-long" ? "too long" : "too short"
			}`,
		};
	}

	if (failedKey.type === "wrong-type") {
		return {
			code: "InvalidFieldType",
			message: `Expected ${failedKey.key} to be ${option.type} but it was ${typeof option}`,
		};
	}

	return {
		code: "InvalidFieldType",
		message: `Expected ${failedKey.key} to be ${option.type} but it was missing`,
	};
};

const bodyValidator = (options: BodyValidator[]) => {
	return ({
		body,
		set,
		app,
	}: CreateRoute<string, Record<string, string>>): CreateMiddleware<Record<string, unknown>> => {
		const failedKeys = validate(options, body, app);

		if (failedKeys.length > 0) {
			set.status = 400;

			const error = ErrorGen.InvalidField();

			for (const failedKey of failedKeys) {
				error.AddError({
					[failedKey.messageKey ?? failedKey.key]: getErrorMessages(failedKey, options),
				});
			}

			return error.toJSON();
		}

		return {};
	};
};

export default bodyValidator;
