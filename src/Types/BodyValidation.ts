/* eslint-disable valid-typeof */
// ? Basically a copy of zod
// ! this is the file we don't talk about
// TODO: rewrite this (someone else do it pwease >>:c)

import App from "@/Utils/Classes/App.ts";
import t from "@/Utils/TypeCheck.ts";

interface AnyType {
	canbeNull?: boolean;
	nullable?(): AnyType;
	optional?(): AnyType;
	required: boolean;
	type: Types;
	validate?(value: unknown): {
		error: string | null;
		valid: boolean;
	};
}

type Types = "array" | "boolean" | "enum" | "number" | "snowflake" | "string";
type Options = "none" | "notNullable" | "required" | "requiredNullable";

type Enumms = boolean | number | string;

type TypeDependentStuff<
	Type extends Types,
	Option extends Options,
	M extends BodyValidator = BodyValidator,
	E extends Enumms[] = Enumms[],
> = Type extends "string"
	? {
			email(): CreateType<Type, Option, M>;
			max(value: number): CreateType<Type, Option, M>;
			min(value: number): CreateType<Type, Option, M>;
		}
	: Type extends "number"
		? {
				max(value: number): CreateType<Type, Option, M>;
				min(value: number): CreateType<Type, Option, M>;
			}
		: Type extends "array"
			? {
					items: M[];
					max(value: number): CreateType<Type, Option, M>;
					min(value: number): CreateType<Type, Option, M>;
				}
			: Type extends "enum"
				? {
						array(): CreateType<Type, Option, M, E, true>;
						values: E;
					}
				: {};

// ? None = not required, can be null
// ? requiredNullable = required, can be null
// ? notNullable = not required, cannot be null
// ? required = required, cannot be null
type CreateType<
	Type extends Types,
	Option extends Options,
	M extends BodyValidator = BodyValidator,
	E extends Enumms[] = Enumms[],
	A extends boolean = false,
> = TypeDependentStuff<Type, Option, M, E> &
	(Option extends "required"
		? {
				nullable(): CreateType<Type, "requiredNullable", M, E>;
				optional(): CreateType<Type, "notNullable", M, E>;
			}
		: Option extends "requiredNullable"
			? {
					optional(): CreateType<Type, "none", M, E>;
				}
			: Option extends "notNullable"
				? {
						nullable(): CreateType<Type, "none", M, E>;
					}
				: Option extends "none"
					? {}
					: never) & {
		canbeNull: Option extends "none" ? true : Option extends "requiredNullable" ? true : false;
		isarray: A;
		required: Option extends "required" ? true : Option extends "requiredNullable" ? true : false;
		type: Type;
	};

interface TypeMapping {
	array: unknown[]; // ! Only here for the Optionalize type, this will never be used
	boolean: boolean;
	enum: string;
	null: null;
	number: number;
	snowflake: string;
	string: string;
}

interface BodyValidator {
	[key: string]: AnyType | BodyValidator | CreateType<Types, Options>;
}

type Optionalize<T extends AnyType> = T["required"] extends true
	? T["canbeNull"] extends true
		? TypeMapping[T["type"]] | null
		: TypeMapping[T["type"]]
	: T["canbeNull"] extends true
		? TypeMapping[T["type"]] | null
		: TypeMapping[T["type"]];

type InferRaw<T> = T extends object
	? {
			[K in keyof T as T[K] extends AnyType
				? T[K]["required"] extends false
					? K
					: never
				: never]?: T[K] extends AnyType
				? T[K]["type"] extends "array"
					? // @ts-expect-error -- it exists, I tried making it understand that but typescript wants to whine about it
						T[K]["items"] extends (infer U)[]
						? T[K]["canbeNull"] extends true
							? InferRaw<U>[] | null
							: InferRaw<U>[]
						: never
					: T[K]["type"] extends "enum"
						? // @ts-expect-error -- ^
							T[K]["isarray"] extends true
							? // @ts-expect-error -- ^
								T[K]["values"]
							: // @ts-expect-error -- ^
								T[K]["values"][number]
						: Optionalize<T[K]>
				: never;
		} & {
			[K in keyof T as T[K] extends AnyType ? (T[K]["required"] extends true ? K : never) : K]: T[K] extends AnyType
				? T[K]["type"] extends "array"
					? // @ts-expect-error -- ^
						T[K]["items"] extends (infer U)[]
						? T[K]["canbeNull"] extends true
							? InferRaw<U>[] | null
							: InferRaw<U>[]
						: never
					: T[K]["type"] extends "enum"
						? // @ts-expect-error -- ^
							T[K]["isarray"] extends true
							? // @ts-expect-error -- ^
								T[K]["values"]
							: // @ts-expect-error -- ^
								T[K]["values"][number]
						: Optionalize<T[K]>
				: InferRaw<T>;
		}
	: never;

type Expand<T> = T extends unknown ? { [K in keyof T]: Expand<T[K]> } : T;

export type Infer<T> = Expand<InferRaw<T>>;

const validate =
	<I extends BodyValidator = BodyValidator, E extends Enumms[] = Enumms[]>(
		type: Types,
		opt: Options,
		min: number,
		max: number,
		email: boolean,
		items?: I,
		values?: E,
		isarray = false,
	) =>
	(value: unknown) => {
		if ((opt === "required" && value === undefined) || value === null)
			return {
				valid: false,
				error: "{key} is required, but was not provided.",
			};
		if (opt === "requiredNullable" && value === undefined)
			return {
				valid: false,
				error: "{key} is required, but was not provided.",
			};
		if (opt === "notNullable" && value === null)
			return {
				valid: false,
				error: "{key} cannot be null.",
			};
		if ((opt === "none" && value === undefined) || value === null)
			return {
				valid: true,
				error: null,
			};

		// if value exists and is not undefined, check if it is the correct type
		if (value !== undefined) {
			if (type === "snowflake")
				return {
					valid: typeof value === "string" && App.Snowflake.Validate(value),
					error: "{key} is not a valid snowflake.",
				};

			if (type === "number") {
				const isNumber = typeof value === "number";

				if (!isNumber || Number.isNaN(value))
					return {
						valid: false,
						error: "{key} is not a number.",
					};

				const error = `{key} was expected to be between ${min === -1 ? "0" : min} and ${
					max === -1 ? "infinity" : max
				}, but received ${value}`;

				if (min > -1 && value < min)
					return {
						valid: false,
						error,
					};

				return {
					valid: !(max > -1 && value > max),
					error,
				};
			}

			if (type === "string") {
				if (email) {
					return {
						valid: t(value, "email"),
						error: "{key} was expected to be an email.",
					};
				}

				if (typeof value !== "string")
					return {
						valid: false,
						error: `{key} was expected to be a string, but received ${typeof value}`,
					};

				const error = `{key} was expected to be between ${min === -1 ? "0" : min} and ${
					max === -1 ? "infinity" : max
				} characters, but received ${value.length}`;

				if (min > -1 && value.length < min)
					return {
						valid: false,
						error,
					};

				return {
					valid: !(max > -1 && value.length > max),
					error,
				};
			}

			if (type === "array") {
				if (!Array.isArray(value))
					return {
						valid: false,
						error: "{key} was expected to be an array, but received unknown",
					};

				const error = `{key} was expected to be between ${min === -1 ? "0" : min} and ${
					max === -1 ? "infinity" : max
				} items, but received ${value.length}`;

				if (min > -1 && value.length < min)
					return {
						valid: false,
						error,
					};
				if (max > -1 && value.length > max)
					return {
						valid: false,
						error,
					};

				if (items) {
					for (const item of value) {
						for (const [key, data] of Object.entries(items)) {
							// @ts-expect-error -- yeah yeah
							if (!data.validate(item[key]))
								return {
									valid: false,
									error: "{key} was invalid.",
								};
						}
					}
				}

				return {
					valid: true,
					error: null,
				};
			}

			if (type === "enum") {
				if (!values)
					return {
						valid: false,
						error: "{key} was expected to be an enum, but no values were provided. (Internal server error)",
					};

				if (!isarray)
					return {
						valid: values.includes(value as E[number]),
						error: `{key} was expected to be one of the following "${values.join(", ")}", but received ${
							// eslint-disable-next-line @typescript-eslint/no-base-to-string
							typeof (value as E[number]) === "object" ? "object" : value
						}`,
					};

				if (!Array.isArray(value))
					return {
						valid: false,
						error: "{key} was expected to be an array, but received unknown",
					};

				for (const val of value) {
					if (!values.includes(val as E[number]))
						return {
							valid: false,
							// eslint-disable-next-line @typescript-eslint/no-base-to-string
							error: `{key} was expected to be one of the following "${values.join(", ")}", but received ${
								typeof (val as E[number]) === "object" ? "object" : val
							}`,
						};
				}

				return {
					valid: true,
					error: null,
				};
			}

			return {
				valid: typeof value === type,
				error: `{key} was expected to be a ${type}, but received ${typeof value}`,
			};
		}

		return {
			valid: opt === "notNullable" ? true : opt === "none" ? true : opt === "required",
			error: "{key} was expected to be provided, but was not.",
		};
	};

const createdType = <
	T extends Types,
	O extends Options,
	I extends BodyValidator = BodyValidator,
	E extends Enumms[] = Enumms[],
	A extends boolean = false,
>(
	type: T,
	option: O,
	email = false,
	min = -1,
	max = -1,
	items?: I,
	values?: E,
	isarray?: A,
) => {
	return {
		canBeNull: option === "none" || option === "requiredNullable",
		optional: () => {
			return createdType(type, option === "required" ? "notNullable" : "none", email, min, max, items, values, isarray);
		},
		nullable: () => {
			return createdType(
				type,
				option === "required" ? "requiredNullable" : "none",
				email,
				min,
				max,
				items,
				values,
				isarray,
			);
		},
		required: option === "required" || option === "requiredNullable",
		type,
		validate: validate(type, option, min, max, email, items, values, isarray),
		min: (value: number) => {
			return createdType(type, option, email, value, max, items, values, isarray);
		},
		max: (value: number) => {
			return createdType(type, option, email, min, value, items, values, isarray);
		},
		email: () => {
			return createdType(type, option, true, min, max, items, values, isarray);
		},
		array: () => {
			return createdType(type, option, email, min, max, items, values, true);
		},
		items,
		values,
		isarray: isarray ?? false,
	} as unknown as CreateType<T, O, I, E, A>;
};

const string = () => createdType("string", "required");
const number = () => createdType("number", "required");
const boolean = () => createdType("boolean", "required");
const snowflake = () => createdType("snowflake", "required");
const array = <T extends BodyValidator>(opt: T) => createdType("array", "required", false, -1, -1, opt);
const enums = <E extends Enumms>(values: E[]) => createdType("enum", "required", false, -1, -1, undefined, values);

export {
	boolean,
	number,
	snowflake,
	string,
	array,
	enums,
	createdType,
	type CreateType,
	type AnyType,
	type Types,
	type BodyValidator,
};
