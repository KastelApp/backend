module.exports = {
    path: "/ws",
    method: "ws",
    middleWare: [],
    /**
     * @param {import('ws').WebSocket} ws 
     * @param {import("express").Request} req 
     */
    run: async (ws, req) => {},
}