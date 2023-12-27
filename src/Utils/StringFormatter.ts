export const EmptyStringToNull = <T = any>(obj: T): T => {
	if (typeof obj !== "object" || obj === null) {
		if (typeof obj === "string" && obj === "") return null as T;

		return obj;
	}

	if (!Array.isArray(obj)) {
		const NewObject: any = {};

		for (const [Key, Value] of Object.entries(obj)) {
			if (Value instanceof Date || Value === null) {
				NewObject[Key] = Value;
			} else if (typeof Value === "object") {
				NewObject[Key] = EmptyStringToNull(Value);
			} else {
				NewObject[Key] = Value === "" ? null : Value;
			}
		}

		return NewObject;
	} else if (Array.isArray(obj)) {
		return obj.map((value) => EmptyStringToNull(value)) as T;
	}

	return obj;
};
