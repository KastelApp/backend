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
                code: 400,
                errors: [{
                    code: "INVALID_API_VERSION",
                    message: "API Version provided is Invalid"
                }]
            }))

            return ws.close()
        }

        const apiData = apis[apiVersion];

        if (!apiData) {
            ws.send(JSON.stringify({
                code: 404,
                errors: [{
                    code: "INVALID_API_VERSION",
                    message: "API Version provided does not exist."
                }]
            }))

            return ws.close()
        }

        if (!apiData.public) {
            ws.send(JSON.stringify({
                code: 403,
                errors: [{
                    code: "INVALID_API_VERSION",
                    message: "API Version provided does not exist."
                }]
            }))

            return ws.close()
        }

        if (!apiData.end_date && apiData.status !== "deprecated") return next();

        const endDate = new Date(Number(apiData.end_date));

        if (endDate < Date.now()) {
            ws.send(JSON.stringify({
                code: 404,
                errors: [{
                    code: "API_VERSION_DEPRECATED",
                    message: `${apiVersion} has reached its EOL, Ending at ${endDate.toLocaleString()}`
                }]
            }))

            return ws.close()
        }

        next();

    },
}