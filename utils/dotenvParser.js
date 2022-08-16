// Is this safe? Probably not.

module.exports = {
    /**
     * @param {{debug: boolean}} options 
     */
    parse: (options = {
        debug: false
    }) => {
        let backupenv = (process.env);

        process.env = {};

        for (let k in backupenv) {
            const item = backupenv[k];

            try {
                const json = JSON.parse(item);

                if (options.debug)
                    console.log(`[Parser][Debug] ${k} is JSON parseable`);

                process.env[k] = json;

            } catch (e) {
                const number = Number(item);

                if (!isNaN(number)) {
                    if (options.debug)
                        console.log(`[Parser][Debug] ${k} is a Number`);

                    process.env[k] = number;
                } else {
                    if (options.debug)
                        console.log(`[Parser][Debug] ${k} is a normal string`);

                    process.env[k] = item;
                }
            }
        }

        delete backupenv;
        return process.env;
    }
}