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

const userSchema = require("../../../../../utils/schemas/users/userSchema")
const { encrypt, decrypt } = require("../../../../../utils/classes/encryption")
const user = require("../../../../../utils/middleware/user")
const schemaData = require("../../../../../utils/schemaData")

/**
 * @typedef {Object} ExportObject
 * @property {String} path The path the user will access the run function at
 * @property {'get'|'GET'|'delete'|'DELETE'|'head'|'HEAD'|'options'|'OPTIONS'|'post'|'POST'|'put'|'PUT'|'patch'|'PATCH'|'purge'|'PURGE'} method The method the user requires
 * @property {('get'|'GET'|'delete'|'DELETE'|'head'|'HEAD'|'options'|'OPTIONS'|'post'|'POST'|'put'|'PUT'|'patch'|'PATCH'|'purge'|'PURGE')[]} [methods] The method the user requires
 * @property {Function[]} middleWare The middleware functions
 * @property {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {}} run The Req, Res and Next Functions 
 */

/**
 * @type {ExportObject}
 */
module.exports = {
    path: "/fetch",
    method: "get",
    middleWare: [user({
        login: {
            loginRequired: true,
        }
    })],
    run: async (req, res, next) => {
        /**
         * @type {String}
         */
        const userId = req?.params?.userId

        if (!userId) {
            res.status(400).send({
                code: 400,
                errors: [{
                    code: "MISSING_USER_ID",
                    message: "No User id provided"
                }]
            })

            return;
        }

        const user = await userSchema.findById(encrypt(userId));

        if (!user) {
            res.status(404).send({
                code: 404,
                errors: [{
                    code: "NO_USER_FOUND",
                    message: "No user was found with the provided id"
                }]
            })

            return;
        }

        res.send({
            code: 200,
            errors: [],
            responses: [],
            data: schemaData("user", user.toJSON())
        })

    },
}