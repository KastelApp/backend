/*! 
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗     
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║     
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║     
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║     
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

const userSchema = require("../../../../utils/schemas/users/userSchema")
const { encrypt, decrypt } = require("../../../../utils/classes/encryption")
const user = require("../../../../utils/middleware/user")

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
    path: "/check",
    method: "post",
    middleWare: [user({
        login: {
            loginRequired: true,
        }
    })],
    run: async (req, res, next) => {
        /**
         * @type {{username: String, tag: String}}
         */
        const { username, tag } = req.body;

        const usr = await userSchema.findOne({
            username: encrypt(username),
            tag
        })

        if (usr) {
            res.send({
                code: 200,
                responses: [{
                    code: "FOUND_USER",
                    message: "There is a user with the provided username and tag"
                }]
            })
        } else {
            res.send({
                code: 200,
                responses: [{
                    code: "NO_USER_FOUND",
                    message: "There is no user with the provided username and tag"
                }]
            })
        }

        return;
    },
}