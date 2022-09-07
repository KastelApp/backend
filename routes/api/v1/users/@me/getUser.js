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

const user = require("../../../../../utils/middleware/user");
const schemaData = require("../../../../../utils/schemaData");
const { encrypt, completeDecryption } = require("../../../../../utils/classes/encryption");
const { friendSchema, userSchema } = require("../../../../../utils/schemas/schemas");

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
    path: "/",
    method: "get",
    middleWare: [user({
        login: {
            loginRequired: true,
        },
    })],
    run: async (req, res, next) => {
        const usr = await userSchema.findById(encrypt(req?.user?.id));

        if (!usr) {

            res.status(500).send({
                code: 500,
                errors: [{
                    code: "ERROR",
                    message: "There was an error while trying to fetch your account. Please report this."
                }],
                responses: []
            })

            return;
        }

        const decryptedData = completeDecryption(usr.toJSON())
        const newData = schemaData("user", decryptedData)

        let friendArray = [
            ...(await friendSchema.find({
                sender: usr._id,
            })),
            ...(await friendSchema.find({
                receiver: usr._id
            }))
        ]

        let friends = []

        for (const friend of friendArray) {
            friends.push((await (await friend.populate("sender")).populate("receiver")).toJSON())
        }

        friends = friendArray.length > 0 ? schemaData("friends", completeDecryption(friends)) : []

        res.send({
            code: 200,
            errors: [],
            responses: [],
            data: {
                ...newData,
                friends
            }
        })
    }
}