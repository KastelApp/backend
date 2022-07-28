const apis = require("../../api.json")
module.exports = {
    path: "/v*",
    method: "ws",
    middleWare: [],
    /**
     * @param {import("ws").WebSocket} ws
     * @param {import("express").Request} req 
     * @param {import("express").NextFunction} next
     */
    run: async (ws, req, next) => {

        const apiPath = req.path.split("/")
        apiPath.shift()
        apiPath.shift()

        const apiVersion = apiPath?.[0]

        if (!apiVersion.startsWith("v")) {
            ws.send(JSON.stringify({
                error: true,
                code: "N/A",
                message: null
            }))

            return ws.close()
        }

        const apiData = apis[apiVersion];

        if (!apiData) {
            ws.send(JSON.stringify({
                error: true,
                code: "N/A",
                message: `Invalid API version. ${apiVersion} not found.`
            }))

            return ws.close()
        }

        if (!apiData.public) {
            ws.send(JSON.stringify({
                error: true,
                code: "N/A",
                message: null
            }))

            return ws.close()
        }

        if (!apiData.end_date && apiData.status !== "deprecated") return next();

        const endDate = new Date(Number(apiData.end_date));

        if (endDate < Date.now()) {
            ws.send(JSON.stringify({
                error: true,
                code: "N/A",
                message: `${apiVersion} is deprecated and is now no longer functional, Its end of life date was ${endDate.toLocaleString()}. If this is an error please report it!`
            }))

            return ws.close()
        }

        next();

    },
}