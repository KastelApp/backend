class idGen {
    static id() {
        const date = String(Number(idGen.startDate) + Date.now());
        const mathNumbers = String(Math.floor(Math.random() * 9999999999999999999))

        let randomNumbers = ""
        let randomRandomNumbers = "";

        for (let i = 0; i < 8; i++) {
            randomNumbers += mathNumbers[Math.floor((Math.random() * mathNumbers.length) * 1)]
        }

        for (let i = 0; i < randomNumbers.length; i++) {
            randomRandomNumbers += randomNumbers[Math.floor((Math.random() * randomNumbers.length) * 1)]
        }

        return (date + randomRandomNumbers.substring(0, 4))
    }

    static get startDate() {
        return (new Date(Number(process.env.startDate)) == "Invalid Date" ? new Date(1658536392598) : new Date(Number(process.env.startDate)))
    }

    /**
     * Get the creation date of an id
     * @param {String} id 
     */
    static checkDate(id) {

        if (typeof id !== "string") id = String(id)

        const date = Number(idGen.startDate)

        const changedId = Number(id.substring(0, 13));

        return (new Date((changedId - date)))
    }
}

module.exports = idGen;