const anonymizeObject = (obj: unknown, recursianDepth = 0): unknown => {
	// Basically, we replace the type of every property with "string" if it's a string, "number" if it's a number, etc.
	// This is for swagger so we can generate a schema for the response.
	// If "SaggerGeneration" is enabled in the config we store 15 responses per route, then every 5ish minutes we generate a schema for each of those responses.
	// Then we compare the schemas. If something isn't in 1 of the schemas but in all the others that would be set as an optional property.
	// We then store those in a json file and you can then use it to generate the openapi.json file.

	// we stop at 50 recursions, so we don't get stuck in an infinite loop
	if (recursianDepth > 50) return "too-deep-object";

	if (typeof obj === "string") return "string";
	if (typeof obj === "number") return "number";
	if (typeof obj === "boolean") return "boolean";
	if (typeof obj === "undefined") return "undefined";
	if (obj === null) return "null";
	if (Array.isArray(obj)) return obj.map((v) => anonymizeObject(v, recursianDepth + 1));

	const newObj: Record<string, any> = {};

	for (const [key, value] of Object.entries(obj)) {
		newObj[key] = anonymizeObject(value, recursianDepth + 1);
	}

	return newObj;
};

export default anonymizeObject;
