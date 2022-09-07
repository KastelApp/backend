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

const { encrypt } = require("../../../../../utils/classes/encryption");
const logger = require("../../../../../utils/classes/logger");
const { FLAGS, BADGES } = require("../../../../../constants");
const user = require("../../../../../utils/middleware/user");
const userSchema = require("../../../../../utils/schemas/users/userSchema");
const friendSchema = require("../../../../../utils/schemas/users/friendSchema");
const { config } = require("../../../../../config");

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
    method: "delete",
    middleWare: [user({
        login: {
            loginRequired: true,
        },
        requesters: [{
            type: "bot",
            allowed: false
        }]
    })],
    run: async (req, res, next) => {
        try {

            return res.send("WIP")

            await userSchema.findByIdAndUpdate(encrypt(req.user.id), {
                email: encrypt(`ghost-${req?.user?.id}+${Date.now()}@${config.Server.domain}`),
                username: encrypt("Ghost"),
                tag: "0000",
                avatar_url: null,
                password: null,
                date_of_birth: null,
                two_fa: null,
                ips: [],
                badges: BADGES.GHOST,
                flags: [FLAGS.GHOST],
                locked: true,
            });

            res.clearCookie("user")

            res.send({
                message: "Account deleted",
            })

            return;

        } catch (er) {
            logger.error(`${req.clientIp} has Encountered an error while deleting their account\n ${er.stack}`);

            res.status(500).send({
                code: 500,
                errors: [{
                    code: "ERROR",
                    message: `There was an Error, Please contact Support.`
                }]
            })

            return;
        }
    },
}