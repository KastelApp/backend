/**
 * 
 * @param {{length: Number, type: String}} obj 
 * @returns 
 */
const lengthChecker = (obj = {
    length: 3,
    type: "LESS" // LESS <=, MORE >=, EQUAL ==, EQUALS ===
}) => {
    return (val) => {
        if (typeof obj.length !== "number") {
            obj.otype = typeof obj.length
            obj.length = Number(obj.length)
        }
        if (typeof obj.length !== "number" || isNaN(obj.length)) throw new Error(`length: Expected Number, Recived ${obj.otype}`)

        if (!["less", "more", "equal", "equals", "<=", ">=", "==", "==="].includes(obj.type.toLowerCase())) throw new Error(`Type: Invalid type, ${obj.type} not a valid type`)

        const valLength = (typeof val == "number") ? val : (typeof val == "object") ? val?.[0] ? val.length : Object.keys(val).length : null;

        switch (obj.type.toLowerCase()) {
            case "less":
            case "<=":
                return valLength <= obj.length
            case "more":
            case ">=":
                return valLength >= obj.length
            case "equal":
            case "equals":
            case "===":
            case "==":
                return valLength === obj.length
        }
    }
}

module.exports = lengthChecker;