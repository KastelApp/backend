// eslint-disable-next-line id-length
const T = (item: any, type: 'bigint' | 'boolean' | 'function' | 'number' | 'object' | 'string' | 'symbol' | 'undefined'): boolean => {
    // eslint-disable-next-line valid-typeof
    return typeof item === type;
}

export {
    T,
}
