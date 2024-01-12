export type Type =
	| "array"
	| "bigint"
	| "boolean"
	| "date"
	| "email"
	| "function"
	| "number"
	| "object"
	| "string"
	| "symbol"
	| "undefined";

/**
 * Checks if a item is of a type, so if you input "false" and "boolean" it will return "true" but if you input "false" and "string" it will return "false"
 *
 * @param item The iten to check
 * @param type The type to check for
 * @returns If the item is of the type
 */
const t = (item: unknown, type: Type, nullable?: boolean): boolean => {
	if (item === null) return Boolean(nullable);

	if (type === "array") {
		return Boolean(Array.isArray(item));
	}

	if (type === "date") {
		if (typeof item !== "object") return false;

		try {
			return Boolean(item instanceof Date);
		} catch {
			return false;
		}
	}

	if (type === "email") {
		if (typeof item !== "string") return false;

		const regex =
			/^[\w!#$%&'*+/=?^`{|}~-](?<email>\.?[\w!#$%&'*+/=?^`{|}~-])*@[\dA-Za-z](?<domain>-*\.?[\dA-Za-z])*\.[A-Za-z](?<tld>-?[\dA-Za-z])+$/;

		if (!regex.test(item)) return false;

		const [local, domain] = item.split("@");

		if (!local || local.length > 64) return false;

		if (!domain || domain.length > 255) return false;

		const domainParts = domain.split(".");

		return !domainParts.some((part) => part.length > 63);
	}

	// eslint-disable-next-line valid-typeof
	return typeof item === type;
};

export { t };

export default t;
