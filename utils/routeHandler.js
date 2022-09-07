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

const fs = require("node:fs");
const path = require("node:path");
const { config } = require("../config");
const logger = require("./classes/logger");
const vaildMethods = ['get', 'delete', 'head', 'options', 'post', 'put', 'patch', 'purge', 'all']
const lineReplacement = "%";

/**
 * @typedef {Object} ExportObject
 * @property {String} path The path the user will access the run function at
 * @property {'get'|'GET'|'delete'|'DELETE'|'head'|'HEAD'|'options'|'OPTIONS'|'post'|'POST'|'put'|'PUT'|'patch'|'PATCH'|'purge'|'PURGE'} [method] The method the user requires
 * @property {('get'|'GET'|'delete'|'DELETE'|'head'|'HEAD'|'options'|'OPTIONS'|'post'|'POST'|'put'|'PUT'|'patch'|'PATCH'|'purge'|'PURGE')[]} [methods] The method the user requires
 * @property {Function[]} middleWare The middleware functions
 * @property {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {}} run The Req, Res and Next Functions 
 */

/**
 * Goes through each DIR and adds them to the Array.
 * @param {String} fipath 
 * @param {string[]} arr 
 * @returns {string[]}
 */
const thrandthr = (fipath, arr) => {
    const dirArray = (arr || []);

    const filePath = (fipath || path.join(__dirname, "..", "routes"));

    const fileInfo = fs.statSync(filePath);

    if (fileInfo.isDirectory()) {
        const files = fs.readdirSync(filePath);
        for (let i = 0; i < files.length; i++) {
            const fi = fs.statSync(path.join(filePath, files[i]));

            if (fi.isDirectory()) {
                thrandthr(path.join(filePath, files[i]), dirArray);
            } else {
                dirArray.push(path.join(filePath, files[i]));
            }
        }
    } else {
        dirArray.push(filePath);
    }

    return dirArray;
}

/**
 * Cuts the filePath, and adds the export path to make a proper route
 * @param {String} filePath The full file path (/home/username/kastel/routes/tests/cool.js) 
 * @param {String} exportPath The exported path (cool_test)
 * @returns {String} The cut path (/tests/cool_test)
 */
const cutter = (filePath, exportPath) => {

    const splitPath = filePath.split("/routes").pop().split("/");

    splitPath.shift(); // shift it once to remove the ('')
    splitPath.pop(); // pop it to remove the .js file part (file_name.js => file_name)

    return splitPath.length >= 1 ? `/${splitPath.join("/")}${exportPath.startsWith("/") ? exportPath : "/" + exportPath}` : `${exportPath}`;
}

/**
 * Loads all the routes.
 * @param {import("express").Application} app
 * @returns {string[]} The route paths
 */
const routeHandler = (app) => {
    const fipaths = thrandthr(null, []);

    for (let i = 0; i < fipaths.length; i++) {
        /**
         * @type {ExportObject}
         */
        const route = require(fipaths[i]);

        if (!route?.path || !(route?.method || route?.methods) || !route?.run) {
            let missingStuff = `${route?.path ? "" : "a Path name, "}${(route?.method || route?.methods ? "" : "a Method, ")}${route?.run ? "" : "a Run Function"}`
            missingStuff = (missingStuff.split(", ").reduce((p, c, i) => i == (missingStuff.split(", ").length - 1) ? p += `, and ${c}` : p += `, ${c}`))
            const missingPath = fipaths[i].split("/routes")[1]
            throw new Error(`${missingPath} is missing ${missingStuff}`)
        }

        const newPath = cutter(fipaths[i], route.path).replaceAll(lineReplacement, ":")

        if (config.Logger.logRoutes) logger.loaded(`Loaded ${newPath} (${route?.method?.toUpperCase() || route?.methods.join(", ")})`)

        if (!route?.method && route?.methods) {
            for (const method of route.methods) {
                if (!vaildMethods.includes(method.toLowerCase()))
                    throw new Error(`Invalid Method ${method}`)

                app[method.toLowerCase()](newPath, ...route.middleWare, (...args) => route.run(...args, app))
            }
        } else {
            if (!vaildMethods.includes(route.method.toLowerCase()))
                throw new Error(`Invalid Method '${route.method}' Valid: ${vaildMethods.join(", ")}`)

            app[route.method.toLowerCase()](newPath, ...route.middleWare, (...args) => route.run(...args, app))
        }
    }

    return fipaths;
}

module.exports = routeHandler;