/* eslint-disable valid-typeof */
// ? Basically a copy of zod

import App from "@/Utils/Classes/App.ts";
import t from "@/Utils/TypeCheck.ts";

interface AnyType {
	canBeNull?: boolean;
	notRequired?(): AnyType;
	nullable?(): AnyType;
	required: boolean;
	type: Types;
}

type Types = "boolean" | "number" | "snowflake" | "string";
type Options = "none" | "notNullable" | "required" | "requiredNullable";

// ? None = not required, can be null
// ? requiredNullable = required, can be null
// ? notNullable = not required, cannot be null
// ? required = required, cannot be null
type CreateType<Type = Types, Option = Options> = Option extends "none"
	? {
			canBeNull: true;
			required: false;
			type: Type;
	  }
	: Option extends "required"
	? {
			canBeNull: false;
			notRequired(): CreateType<Type, "notNullable">;
			nullable(): CreateType<Type, "requiredNullable">;
			required: true;
			type: Type;
	  }
	: Option extends "requiredNullable"
	? {
			canBeNull: true;
			notRequired(): CreateType<Type, "none">;
			required: true;
			type: Type;
	  }
	: Option extends "notNullable"
	? {
			canBeNull: false;
			nullable(): CreateType<Type, "none">;
			required: false;
			type: Type;
	  }
	: never;

interface TypeMapping {
	boolean: boolean;
	null: null;
	number: number;
	snowflake: string;
	string: string;
}

interface BodyValidator {
	[key: string]: AnyType | BodyValidator | TypeValidator<Types>;
}

type Optionalize<T extends AnyType> = T["required"] extends true
	? T["canBeNull"] extends true
		? TypeMapping[T["type"]] | null
		: TypeMapping[T["type"]]
	: T["canBeNull"] extends true
	? TypeMapping[T["type"]] | null
	: TypeMapping[T["type"]];

type InferRaw<T> = T extends object
	? {
			[K in keyof T as T[K] extends AnyType
				? T[K]["required"] extends false
					? K
					: never
				: never]?: T[K] extends AnyType ? Optionalize<T[K]> : never;
	  } & {
			[K in keyof T as T[K] extends AnyType ? (T[K]["required"] extends true ? K : never) : K]: T[K] extends AnyType
				? Optionalize<T[K]>
				: InferRaw<T[K]>;
	  }
	: never;

type Expand<T> = T extends unknown ? { [K in keyof T]: Expand<T[K]> } : T;

export type Infer<T> = Expand<InferRaw<T>>;

const none = <T extends Types>(type: T, email = false, min = -1, max = -1): TypeValidator<T, "none"> => {
	return {
		canBeNull: true,
		required: false,
		type,
		validate: (value: unknown) => {
			if (value === null) return true;

			// if value exists and is not undefined, check if it is the correct type
			if (value !== undefined) {
				if (type === "snowflake") return typeof value === "string" && App.Snowflake.Validate(value);
				if (type === "number") {
					const isNumber = typeof value === "number";

					if (!isNumber || Number.isNaN(value)) return false;

					if (min > -1 && value < min) return false;

					return !(max > -1 && value > max);
				}

				if (type === "string") {
					if (email) {
						return t(value, "email");
					}

					if (typeof value !== "string") return false;
					if (min > -1 && value.length < min) return false;
					if (max > -1 && value.length > max) return false;
				}

				return typeof value === type;
			}

			// else we return true since it is not required
			return true;
		},
		min: (value: number) => {
			return none(type, email, value, max);
		},
		max: (value: number) => {
			return none(type, email, min, value);
		},
		email: () => {
			return none(type, true, min, max);
		},
	} as unknown as TypeValidator<T, "none">;
};

const requiredNullable = <T extends Types>(
	type: T,
	email = false,
	min = -1,
	max = -1,
): TypeValidator<T, "requiredNullable"> => {
	return {
		canBeNull: true,
		notRequired: () => {
			return none(type);
		},
		required: true,
		type,
		validate: (value: unknown) => {
			if (value === null) return true;

			// if value exists and is not undefined, check if it is the correct type
			if (value !== undefined) {
				if (type === "snowflake") return typeof value === "string" && App.Snowflake.Validate(value);
				if (type === "number") {
					const isNumber = typeof value === "number";

					if (!isNumber || Number.isNaN(value)) return false;

					if (min > -1 && value < min) return false;

					return !(max > -1 && value > max);
				}

				if (type === "string") {
					if (email) {
						return t(value, "email");
					}

					if (typeof value !== "string") return false;
					if (min > -1 && value.length < min) return false;
					if (max > -1 && value.length > max) return false;
				}

				return typeof value === type;
			}

			// else we return false since it is required
			return false;
		},
		min: (value: number) => {
			return requiredNullable(type, email, value, max);
		},
		max: (value: number) => {
			return requiredNullable(type, email, min, value);
		},
		email: () => {
			return requiredNullable(type, true, min, max);
		},
	} as unknown as TypeValidator<T, "requiredNullable">;
};

const notRequired = <T extends Types>(type: T, email = false, min = -1, max = -1): TypeValidator<T, "notNullable"> => {
	return {
		canBeNull: false,
		nullable: () => {
			return none(type);
		},
		required: false,
		type,
		validate: (value: unknown) => {
			if (value === null) return false;

			// if value exists and is not undefined, check if it is the correct type
			if (value !== undefined) {
				if (type === "snowflake") return typeof value === "string" && App.Snowflake.Validate(value);
				if (type === "number") {
					const isNumber = typeof value === "number";

					if (!isNumber || Number.isNaN(value)) return false;

					if (min > -1 && value < min) return false;

					return !(max > -1 && value > max);
				}

				if (type === "string") {
					if (email) {
						return t(value, "email");
					}

					if (typeof value !== "string") return false;
					if (min > -1 && value.length < min) return false;
					if (max > -1 && value.length > max) return false;
				}

				return typeof value === type;
			}

			// else we return true since it is not required
			return true;
		},
		min: (value: number) => {
			return notRequired(type, email, value, max);
		},
		max: (value: number) => {
			return notRequired(type, email, min, value);
		},
		email: () => {
			return notRequired(type, true, min, max);
		},
	} as unknown as TypeValidator<T, "notNullable">;
};

const required = <T extends Types>(type: T, email = false, min = -1, max = -1): TypeValidator<T, "required"> => {
	return {
		canBeNull: false,
		notRequired: () => {
			return notRequired(type);
		},
		nullable: () => {
			return requiredNullable(type);
		},
		required: true,
		type,
		validate: (value: unknown) => {
			if (value === null) return false;

			// if value exists and is not undefined, check if it is the correct type
			if (value !== undefined) {
				if (type === "snowflake") return typeof value === "string" && App.Snowflake.Validate(value);
				if (type === "number") {
					const isNumber = typeof value === "number";

					if (!isNumber || Number.isNaN(value)) return false;

					if (min > -1 && value < min) return false;

					return !(max > -1 && value > max);
				}

				if (type === "string") {
					if (email) {
						return t(value, "email");
					}

					if (typeof value !== "string") return false;
					if (min > -1 && value.length < min) return false;
					if (max > -1 && value.length > max) return false;
				}

				return typeof value === type;
			}

			// else we return false since it is required
			return false;
		},
		min: (value: number) => {
			return required(type, email, value, max);
		},
		max: (value: number) => {
			return required(type, email, min, value);
		},
		email: () => {
			return required(type, true, min, max);
		},
	} as unknown as TypeValidator<T, "required">;
};

type TypeValidator<T extends Types, O extends Options = "required"> = CreateType<T, O> &
	(T extends "number"
		? {
				max(value: number): TypeValidator<T, O>;
				min(value: number): TypeValidator<T, O>;
		  }
		: {}) &
	(T extends "string"
		? {
				email(): TypeValidator<T, O>;
				max(value: number): TypeValidator<T, O>;
				min(value: number): TypeValidator<T, O>;
		  }
		: {}) & {
		// email(): TypeValidator<T, O>;
		// maximum(value: number): TypeValidator<T, O>;
		// minimum(value: number): TypeValidator<T, O>;
		validate(value: unknown): boolean;
	};

const string = () => required("string");
const number = () => required("number");
const boolean = () => required("boolean");
const snowflake = () => required("snowflake");

export {
	boolean,
	number,
	required,
	requiredNullable,
	snowflake,
	string,
	notRequired,
	none,
	type TypeValidator,
	type AnyType,
	type Types,
	type BodyValidator,
};
