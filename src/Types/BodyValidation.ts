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
		multiErrors: {
			error: string;
			key: string;
			multiErrors?: {
				error: string;
				key: string;
				pos: number;
				valid: boolean;
			}[];
			pos: number;
			valid: boolean;
		}[];
		valid: boolean;
	};
}

type Types = "array" | "boolean" | "enum" | "number" | "object" | "snowflake" | "string";
type Options = "none" | "notNullable" | "required" | "requiredNullable";
type Enumms = boolean | number | string;
type ObjectOptions = "keyof" | "obj";

type TypeDependentStuff<
	Type extends Types,
	Option extends Options,
	M extends BodyValidator = BodyValidator,
	E extends Enumms[] = Enumms[],
	OType extends ObjectOptions = ObjectOptions,
> = Type extends "string"
	? {
			email(): CreateType<Type, Option, M, E, false, OType>;
			max(value: number): CreateType<Type, Option, M, E, false, OType>;
			min(value: number): CreateType<Type, Option, M, E, false, OType>;
		}
	: Type extends "number"
		? {
				max(value: number): CreateType<Type, Option, M, E, false, OType>;
				min(value: number): CreateType<Type, Option, M, E, false, OType>;
			}
		: Type extends "array"
			? {
					items: M[];
					max(value: number): CreateType<Type, Option, M, E, true, OType>;
					min(value: number): CreateType<Type, Option, M, E, true, OType>;
				}
			: Type extends "enum"
				? {
						array(): CreateType<Type, Option, M, E, true>;
						values: E;
					}
				: Type extends "object"
					? {
							items: M;
							otype: OType;
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
	OType extends ObjectOptions = ObjectOptions,
> = TypeDependentStuff<Type, Option, M, E, OType> &
	(Option extends "required"
		? {
				nullable(): CreateType<Type, "requiredNullable", M, E, A, OType>;
				optional(): CreateType<Type, "notNullable", M, E, A, OType>;
			}
		: Option extends "requiredNullable"
			? {
					optional(): CreateType<Type, "none", M, E, A, OType>;
				}
			: Option extends "notNullable"
				? {
						nullable(): CreateType<Type, "none", M, E, A, OType>;
					}
				: Option extends "none"
					? {}
					: true) & {
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
	object: unknown;
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

type InfererRawRaw<T extends object, K extends keyof T> = T[K] extends AnyType
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
			: T[K]["type"] extends "object"
				? // @ts-expect-error -- ^
					T[K]["otype"] extends "keyof"
					? {
							// @ts-expect-error -- ^
							[key: string]: InferRaw<T[K]["items"]>;
						}
					: // @ts-expect-error -- ^
						InferRaw<T[K]["items"]>
				: Optionalize<T[K]>
	: never;

type InferRaw<T> = T extends object
	? {
			[K in keyof T as T[K] extends AnyType ? (T[K]["required"] extends false ? K : never) : never]?: InfererRawRaw<
				T,
				K
			>;
		} & {
			[K in keyof T as T[K] extends AnyType ? (T[K]["required"] extends true ? K : never) : K]: InfererRawRaw<T, K>;
		}
	: never;

type Expand<T> = T extends unknown ? { [K in keyof T]: Expand<T[K]> } : T;

export type Infer<T> = Expand<InferRaw<T>>;

const validate =
	<I extends BodyValidator = BodyValidator, E extends Enumms[] = Enumms[], OType extends ObjectOptions = ObjectOptions>(
		type: Types,
		opt: Options,
		min: number,
		max: number,
		email: boolean,
		items?: I,
		values?: E,
		isarray = false,
		objecttype?: OType,
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
					const errors = [];
					for (const item of value) {
						for (const [key, data] of Object.entries(items)) {
							// @ts-expect-error -- yeah yeah
							const validated = data.validate(item[key]);

							console.log(key, validated);

							if (!validated.valid)
								errors.push({
									valid: validated.valid as boolean,
									error: validated.error ? (validated.error.replace("{key}", key) as string) : null,
									key,
									pos: value.indexOf(item),
									multiErrors: validated.multiErrors,
								});
						}
					}

					return {
						valid: errors.length === 0,
						error: null,
						multiErrors: errors,
					};
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

			if (type === "object") {
				// keyof: { name: { item: BodyValidator }}
				// obj: { item: BodyValidator }
				const errors = [];

				if (!objecttype)
					return {
						valid: false,
						error: "{key} was expected to be an object, but no values were provided. (Internal server error)",
					};

				if (typeof value !== "object" || Array.isArray(value))
					return {
						valid: false,
						error: "{key} was expected to be an object, but received unknown",
					};

				if (objecttype === "keyof") {
					for (const [key, vv] of Object.entries(value)) {
						for (const [k, v] of Object.entries(items ?? {})) {
							// @ts-expect-error -- yeah yeah
							const validated = v.validate(vv[k]);

							if (!validated.valid)
								errors.push({
									valid: validated.valid as boolean,
									error: validated.error ? (validated.error.replace("{key}", k) as string) : null,
									key: `${key}.${k}`,
									pos: -1,
								});
						}
					}
				} else {
					for (const [key, v] of Object.entries(items ?? {})) {
						// @ts-expect-error -- yeah yeah
						const validated = v.validate(value[key]);

						if (!validated.valid)
							errors.push({
								valid: validated.valid as boolean,
								error: validated.error ? (validated.error.replace("{key}", key) as string) : null,
								key,
								pos: -1,
							});
					}
				}

				return {
					valid: errors.length === 0,
					error: null,
					multiErrors: errors,
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
	Type extends Types,
	Option extends Options,
	Body extends BodyValidator = BodyValidator,
	Enums extends Enumms[] = Enumms[],
	IsArray extends boolean = false,
	OType extends ObjectOptions = ObjectOptions,
>(
	type: Type,
	option: Option,
	email = false,
	min = -1,
	max = -1,
	items?: Body,
	values?: Enums,
	isarray?: IsArray,
	objecttype?: OType,
) => {
	return {
		canBeNull: option === "none" || option === "requiredNullable",
		optional: () => {
			return createdType(
				type,
				option === "required" ? "notNullable" : "none",
				email,
				min,
				max,
				items,
				values,
				isarray,
				objecttype,
			);
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
				objecttype,
			);
		},
		required: option === "required" || option === "requiredNullable",
		type,
		validate: validate(type, option, min, max, email, items, values, isarray, objecttype),
		min: (value: number) => {
			return createdType(type, option, email, value, max, items, values, isarray, objecttype);
		},
		max: (value: number) => {
			return createdType(type, option, email, min, value, items, values, isarray, objecttype);
		},
		email: () => {
			return createdType(type, option, true, min, max, items, values, isarray, objecttype);
		},
		array: () => {
			return createdType(type, option, email, min, max, items, values, true, objecttype);
		},
		items,
		values,
		isarray: isarray ?? false,
	} as unknown as CreateType<Type, Option, Body, Enums, IsArray, OType>;
};

const string = () => createdType("string", "required");
const number = () => createdType("number", "required");
const boolean = () => createdType("boolean", "required");
const snowflake = () => createdType("snowflake", "required");
const array = <T extends BodyValidator>(opt: T) => createdType("array", "required", false, -1, -1, opt);
const enums = <E extends Enumms>(values: E[]) => createdType("enum", "required", false, -1, -1, undefined, values);
// O = keyof | obj
// keyof, is a object like this: { [key: string]: yourotheroptions }
// obj, is a object of your options
const object = <T extends BodyValidator, O extends ObjectOptions>(body: T, opt?: O) =>
	createdType("object", "required", false, -1, -1, body, undefined, false, opt);

export {
	boolean,
	number,
	snowflake,
	string,
	array,
	enums,
	createdType,
	object,
	type CreateType,
	type AnyType,
	type Types,
	type BodyValidator,
};
