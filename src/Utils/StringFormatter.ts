export const EmptyStringToNull = <T = any>(obj: T): T =>{
    if (typeof obj !== "object" || obj === null) {
        if (typeof obj === "string" && obj === "") return null as T;

        return obj;
    }

    if (!Array.isArray(obj)) {
        const newObject: any = {};

        for (const [key, value] of Object.entries(obj)) {
            if (value instanceof Date || value === null) {
                newObject[key] = value;
            } else if (typeof value === "object") {
                newObject[key] = EmptyStringToNull(value);
            } else {
                newObject[key] = value === "" ? null : value;
            }
        }

        return newObject;
    } else if (Array.isArray(obj)) {
        return obj.map((value) => EmptyStringToNull(value)) as T;
    }

    return obj;
}
