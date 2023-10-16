// eslint-disable-next-line id-length
const T = (
	item: any,
	type: 'array' | 'bigint' | 'boolean' | 'date' | 'function' | 'number' | 'object' | 'string' | 'symbol' | 'undefined',
): boolean => {
	if (type === 'array') {
		return Boolean(Array.isArray(item));
	}

	if (type === 'date') {
		if (typeof item !== 'object') return false;

		try {
			return Boolean(item instanceof Date);
		} catch {
			return false;
		}
	}

	// eslint-disable-next-line valid-typeof
	return typeof item === type;
};

export { T };
