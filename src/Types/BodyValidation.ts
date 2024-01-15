/* eslint-disable valid-typeof */
// ? Basically a copy of zod

// TODO: rewrite this (someone else do it pwease >>:c)

import App from "@/Utils/Classes/App.ts";
import t from "@/Utils/TypeCheck.ts";

interface AnyType {
	canBeNull?: boolean;
	nullable?(): AnyType;
	optional?(): AnyType;
	required: boolean;
	type: Types;
}

type Types = "array" | "boolean" | "number" | "snowflake" | "string";
type Options = "none" | "notNullable" | "required" | "requiredNullable";

type TypeDependentStuff<Type extends Types, Option extends Options, M extends BodyValidator = BodyValidator> = (Type extends "string" ? {
	email(): CreateType<Type, Option, M>;
	max(value: number): CreateType<Type, Option, M>;
	min(value: number): CreateType<Type, Option, M>;
} : Type extends "number" ? {
	max(value: number): CreateType<Type, Option, M>;
	min(value: number): CreateType<Type, Option, M>;
} : Type extends "array" ? {
	items: M[]
	max(value: number): CreateType<Type, Option, M>;
	min(value: number): CreateType<Type, Option, M>;
} : {});

// ? None = not required, can be null
// ? requiredNullable = required, can be null
// ? notNullable = not required, cannot be null
// ? required = required, cannot be null
type CreateType<Type extends Types, Option extends Options, M extends BodyValidator = BodyValidator> = TypeDependentStuff<Type, Option, M> & (Option extends "required" ? {
	nullable(): CreateType<Type, "requiredNullable", M>;
	optional(): CreateType<Type, "notNullable", M>;
} : Option extends "requiredNullable" ? {
	optional(): CreateType<Type, "none", M>;
} : Option extends "notNullable" ? {
	nullable(): CreateType<Type, "none", M>;
} : Option extends "none" ? {} : never) & {
	canbeNull: Option extends "none" ? true : Option extends "requiredNullable" ? true : false;
	required: Option extends "required" ? true : Option extends "requiredNullable" ? true : false;
	type: Type;
};

interface TypeMapping {
	array: unknown[]; // ! Only here for the Optionalize type, this will never be used
	boolean: boolean;
	null: null;
	number: number;
	snowflake: string;
	string: string;
}

interface BodyValidator {
	[key: string]: AnyType | BodyValidator | CreateType<Types, Options>
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
		: never]?: T[K] extends AnyType
		// @ts-expect-error -- it exists, I tried making it understand that but typescript wants to whine about it
		? T[K]["type"] extends "array" ? T[K]["items"] extends (infer U)[] ? InferRaw<U>[] : never  : Optionalize<T[K]>
		: never;
	} & {
		[K in keyof T as T[K] extends AnyType ? (T[K]["required"] extends true ? K : never) : K]: T[K] extends AnyType
		// @ts-expect-error -- it exists, I tried making it understand that but typescript wants to whine about it
		? T[K]["type"] extends "array" ? T[K]["items"] extends (infer U)[] ? InferRaw<U>[] : never  : Optionalize<T[K]>
		: InferRaw<T>;
	}
	: never;

type Expand<T> = T extends unknown ? { [K in keyof T]: Expand<T[K]> } : T;

export type Infer<T> = Expand<InferRaw<T>>;

const none = <T extends Types, I extends BodyValidator = BodyValidator>(type: T, email = false, min = -1, max = -1, m?: I): CreateType<T, "none", I> => {
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
				
				if (type === "array") {
					if (!Array.isArray(value)) return false;
					
					if (min > -1 && value.length < min) return false;
					if (max > -1 && value.length > max) return false;
					
					if (m) {
						for (const item of value) {
							for (const [key, data] of Object.entries(m)) {
								// @ts-expect-error -- yeah yeah
								if (!data.validate(item[key])) return false
							}
						}
					}
					
					return true;
				}

				return typeof value === type;
			}

			// else we return true since it is not required
			return true;
		},
		min: (value: number) => {
			return none(type, email, value, max, m);
		},
		max: (value: number) => {
			return none(type, email, min, value, m);
		},
		email: () => {
			return none(type, true, min, max, m);
		},
		items: m
	} as unknown as CreateType<T, "none", I>;
};

const requiredNullable = <T extends Types, I extends BodyValidator = BodyValidator>(
	type: T,
	email = false,
	min = -1,
	max = -1,
	m?: I
): CreateType<T, "requiredNullable", I> => {
	return {
		canBeNull: true,
		optional: () => {
			return none(type, email, min, max, m);
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

				if (type === "array") {
					if (!Array.isArray(value)) return false;
					
					if (min > -1 && value.length < min) return false;
					if (max > -1 && value.length > max) return false;
					
					if (m) {
						for (const item of value) {
							for (const [key, data] of Object.entries(m)) {
								// @ts-expect-error -- yeah yeah
								if (!data.validate(item[key])) return false
							}
						}
					}
					
					return true;
				}
				
				return typeof value === type;
			}

			// else we return false since it is required
			return false;
		},
		min: (value: number) => {
			return requiredNullable(type, email, value, max, m);
		},
		max: (value: number) => {
			return requiredNullable(type, email, min, value, m);
		},
		email: () => {
			return requiredNullable(type, true, min, max, m);
		},
		items: m
	} as unknown as CreateType<T, "requiredNullable", I>;
};

const notRequired = <T extends Types, I extends BodyValidator = BodyValidator>(type: T, email = false, min = -1, max = -1, m?: I): CreateType<T, "notNullable", I> => {
	return {
		canBeNull: false,
		nullable: () => {
			return none(type, email, min, max, m);
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

				if (type === "array") {
					if (!Array.isArray(value)) return false;
					
					if (min > -1 && value.length < min) return false;
					if (max > -1 && value.length > max) return false;
					
					if (m) {
						for (const item of value) {
							for (const [key, data] of Object.entries(m)) {
								// @ts-expect-error -- yeah yeah
								if (!data.validate(item[key])) return false
							}
						}
					}
					
					return true;
				}
				
				return typeof value === type;
			}

			// else we return true since it is not required
			return true;
		},
		min: (value: number) => {
			return notRequired(type, email, value, max, m);
		},
		max: (value: number) => {
			return notRequired(type, email, min, value, m);
		},
		email: () => {
			return notRequired(type, true, min, max, m);
		},
		items: m
	} as unknown as CreateType<T, "notNullable", I>;
};

const required = <T extends Types, I extends BodyValidator = BodyValidator>(type: T, email = false, min = -1, max = -1, m?: I): CreateType<T, "required", I> => {
	return {
		canBeNull: false,
		optional: () => {
			return notRequired(type, email, min, max, m);
		},
		nullable: () => {
			return requiredNullable(type, email, min, max, m);
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

				if (type === "array") {
					if (!Array.isArray(value)) return false;
					
					if (min > -1 && value.length < min) return false;
					if (max > -1 && value.length > max) return false;
					
					if (m) {
						for (const item of value) {
							for (const [key, data] of Object.entries(m)) {
								// @ts-expect-error -- yeah yeah
								if (!data.validate(item[key])) return false
							}
						}
					}
					
					return true;
				}
				
				return typeof value === type;
			}

			// else we return false since it is required
			return false;
		},
		min: (value: number) => {
			return required(type, email, value, max, m);
		},
		max: (value: number) => {
			return required(type, email, min, value, m);
		},
		email: () => {
			return required(type, true, min, max, m);
		},
		items: m
	} as unknown as CreateType<T, "required", I>;
};

const string = () => required("string");
const number = () => required("number");
const boolean = () => required("boolean");
const snowflake = () => required("snowflake");

const array = <T extends BodyValidator>(opt: T) => required("array", false, -1, -1, opt);

export {
	boolean,
	number,
	required,
	requiredNullable,
	snowflake,
	string,
	notRequired,
	none,
	array,
	type CreateType as TypeValidator,
	type AnyType,
	type Types,
	type BodyValidator,
};
