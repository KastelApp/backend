const apis = require("../../api.json")
module.exports = {
    path: "/v*",
    // all the methods that will most likely be used, Might be changed later on as differnt endpoints get added
    methods: ["get", "post", "put", "patch", "delete", "options"],
    middleWare: [],
    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     * @param {import("express").NextFunction} next 
     */
    run: async (req, res, next) => {
        const apiPath = req.path.split("/")

        apiPath.shift()

        // Simple but bad WS checker, Needs improved
        // The idea is just so when someone connects to the websocket we can also check API versions without errors
        // though this of course does cause errors if it fails the ended check, but it could be improved.
        // I would just rather not do a complete pass through if it ends with .websocket or includes /ws/
        if (req.method == "GET" && req.path.endsWith(".websocket") && req.path.includes("ws")) {
            apiPath.shift()
            apiPath.shift()

            // if the user is really connecting to the old dead ws after shifting it three times
            // it should be /ws/
            if (apiPath[0] !== "ws") {
                logger.warn(`${req.user_ip} Failed the WS Check`)
                return res.send({
                    error: true
                })
            }

            apiPath.shift()

            // after that we shift it one more time and it should be /.websocket
            if (apiPath[0] !== '.websocket') {
                logger.warn(`${req.user_ip} Failed the .websocket Check`)
                return res.send({
                    error: true
                })
            }

            apiPath.shift();

            // we shift it one last time if it was really just a websocket connection
            // nothing in the array should be left. If there is something they failed the check
            if (apiPath.length > 0) {
                logger.warn(`${req.user_ip} Failed the remaning length check`)
                return res.send({
                    error: true
                })
            }

            // we then next it if it passes all the checks, This is so it can go to the ws version check
            return next()
        }

        apiPath.shift()

        const apiVersion = apiPath?.[0]

        if (!apiVersion.startsWith("v")) {
            return res.send({
                error: true,
                code: "N/A",
                message: null
            })
        }

        const apiData = apis[apiVersion];

        if (!apiData) {
            return res.send({
                error: true,
                code: "N/A",
                message: `Invalid API version. ${apiVersion} not found.`
            })
        }

        // we return no message since its not public, I think its better then telling them 
        // that there is a private API.
        if (!apiData.public) {
            return res.send({
                error: true,
                code: "N/A",
                message: `Invalid API version. ${apiVersion} not found.`
            })
        }


        // if the API version is deprecated it will most likely of a end date set as well
        // once the end date is passed the api will no longer work whatsoever
        if (apiData.end_date) {
            const endDate = new Date(Number(apiData.end_date));

            if (endDate < Date.now()) {
                return res.send({
                    error: true,
                    code: "N/A",
                    message: `${apiVersion} is deprecated and is now no longer functional, Its end of life date was ${endDate.toLocaleString()}. If this is an error please report it.`
                })
            }
        }

        // if everything else is fine then let them go on to the normal endpoint
        return next();

    },
}