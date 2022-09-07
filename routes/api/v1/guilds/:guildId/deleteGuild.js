const userMiddleware = require("../../../../../utils/middleware/user")

// TODO: Finish the Delete route
// NOTES: If the user has 2FA then require a 2FA code

/**
 * @typedef {Object} ExportObject
 * @property {String} path The path the user will access the run function at
 * @property {'get'|'GET'|'delete'|'DELETE'|'head'|'HEAD'|'options'|'OPTIONS'|'post'|'POST'|'put'|'PUT'|'patch'|'PATCH'|'purge'|'PURGE'} [method] The method the user requires
 * @property {('get'|'GET'|'delete'|'DELETE'|'head'|'HEAD'|'options'|'OPTIONS'|'post'|'POST'|'put'|'PUT'|'patch'|'PATCH'|'purge'|'PURGE')[]} [methods] The method the user requires
 * @property {Function[]} middleWare The middleware functions
 * @property {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {}} run The Req, Res and Next Functions 
 */

/**
 * @type {ExportObject}
 */
module.exports = {
    path: "/delete",
    method: "delete",
    middleWare: [userMiddleware({
        login: {
            loginRequired: true,
        },
        requesters: [{
            type: "BOT",
            allowed: false
        }, {
            type: "USER",
            allowed: true
        }]
    })],
    run: async (req, res) => {
        /**
         * @type {String}
         */
        const guildId = req.params.guildId

    }
}