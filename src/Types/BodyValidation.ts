import type { Type } from "@/Utils/TypeCheck.ts";

export type OurTypes = Type | "complex" | "snowflake";

interface BaseBodyValidator {
	key: string;
	nullable?: boolean;
	required: boolean;
}

interface ComplexBodyValidator extends BaseBodyValidator {
	body: BodyValidator[];
	key: string;
	required: boolean;
	type: "complex";
}

interface NumberBodyValidator extends BaseBodyValidator {
	key: string;
	max?: number;
	min?: number;
	required: boolean;
	type: "number";
}

interface SnowflakeBodyValidator extends BaseBodyValidator {
	key: string;
	mustBeValid: boolean;
	required: boolean;
	type: "snowflake";
}

export type BodyValidator =
	| ComplexBodyValidator
	| NumberBodyValidator
	| SnowflakeBodyValidator
	| (BaseBodyValidator & {
			type: Exclude<OurTypes, "complex" | "number" | "snowflake">;
	  });
