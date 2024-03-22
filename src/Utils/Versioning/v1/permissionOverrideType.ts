const permissionOverrideType = (value: any): value is [[string, string]] => {
	return (
		Array.isArray(value) &&
		value.every((v) => Array.isArray(v) && v.length === 2 && typeof v[0] === "string" && typeof v[1] === "string")
	);
};

export default permissionOverrideType;
