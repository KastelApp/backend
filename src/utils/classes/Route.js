/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */


// TODO: Make Dynamic types for params

/**
 * @type {import('../../..').RouteItem[]}
 */
const routes = [];
const vaildMethods = ['get', 'delete', 'head', 'options', 'post', 'put', 'patch', 'purge', 'all'];
const pathToRegexp = require('path-to-regexp');
const fs = require('node:fs');
const path = require('node:path');

/**
 * A Class for handling routes better and easier
 * @example  const Route = require("router")

new Route(__dirname, "/test", "GET", async (req, res, next) => {
    res.send("Hello World")
})
 */
class Route {
    /**
     * @param {String} dir The DIR of the file
     * @param {String} route The route the user will access from
     * @param {import('../../..').Methods} method The Method(s) the path accepts
     * @param {import('../../..').RunCallBack|(import('../../..').RunCallBack|Function)[]} middleware The middleware
     * @param {import('../../..').RunCallBack} run The Req, Res and Next Functions
     */
    constructor(dir, route, method, middleware, run) {

        /**
         * @type {String}
         * @private
         */
        this._dir = dir;

        /**
         * @type {String}
         * @private
         */
        this._path = this.cutter(this._dir.replaceAll('%', ':'), route);

        this._middleware = typeof middleware !== 'object' ? typeof middleware == 'function' ? [] : middleware : middleware;

        /**
         * @type {import('../../..').RunCallBack}
         * @private
         */
        this._run = typeof run == 'undefined' ? typeof middleware !== 'object' ? typeof middleware == 'function' ? middleware : run : run : run;

        /**
         * @type {import('../../..').Methods}
         * @private
         */
        this._method = method;

        if (Array.isArray(this._method)) {
            for (let i = 0; i < this._method.length; i++) {
                if (!vaildMethods.includes(this._method[i].toLowerCase())) {
                    throw new Error(`${this._path} Has an Invalid Method (${this._method[i]})`);
                }
            }
        } else if (!vaildMethods.includes(this._method.toLowerCase())) {
            throw new Error(`${this._path} Has an Invalid Method (${this._method})`);
        }

        routes.push({
            method: this._method,
            path: this._path,
            regex: new RegExp(pathToRegexp(this._path)),
            run: this._run,
            middleware: this._middleware,
            Route: this,
        });
    }

    /**
     * @public
     * @alias path
     * @returns {String} The route
     */
    get route() {
        return this._path;
    }

    /**
     * @public
     * @returns {import('../../..').Methods} The method(s) the route uses
     */
    get methods() {
        return this._method;
    }

    /**
     * @public
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     * @returns {void}
     */
    run(req, res, next) {
        this._run(req, res, next);
    }

    /**
     * Cuts the filePath, and adds the export path to make a proper route
     * @private
     * @param {String} filePath The full file path (/home/darkerink/kastel/routes/tests/cool.js)
     * @param {String} exportPath The exported path (cool_test)
     * @returns {String} The cut path (/tests/cool_test)
     */
    cutter(filePath, exportPath) {

        if (process.platform === 'win32') {
            const splitPath = filePath.split('\\routes').pop().replace(/\\/g, '/').split('/').slice(0, -1).join('/');

            return `${splitPath}${exportPath.startsWith('/') ? exportPath : '/' + exportPath}`;
        } else {
            const splitPath = filePath.split('/routes').pop().split('/').slice(0, -1).join('/');

            return `${splitPath}${exportPath.startsWith('/') ? exportPath : '/' + exportPath}`;
        }
    }

    /**
     * Sets all the routes
     * @param {import('express').Application} app
     */
    static setRoutes(app) {
        if (!app) {
            throw new Error('Please provide the Express Application');
        }

        for (let i = 0; i < routes.length; i++) {
            const route = routes[i];


            if (Array.isArray(route.method)) {
                for (let j = 0; i < route.method.length; i++) {
                    app[(route.method[j].toLowerCase())](route.path, ...route.middleware, (...args) => route.run(...args, app.cache));
                }
            } else {
                app[(route.method.toLowerCase())](route.path, ...route.middleware, (...args) => route.run(...args, app.cache));
            }
        }

        return routes;
    }

    /**
     * Goes through each DIR and adds them to the Array.
     * @param {String} fipath
     * @param {string[]} arr
     * @returns {string[]}
     */
    static throughAndThrough(fipath, arr) {
        const dirArray = (arr || []);

        const filePath = fipath;

        const fileInfo = fs.statSync(filePath);

        if (fileInfo.isDirectory()) {
            const files = fs.readdirSync(filePath);
            for (let i = 0; i < files.length; i++) {
                const fi = fs.statSync(path.join(filePath, files[i]));

                if (fi.isDirectory()) {
                    Route.throughAndThrough(path.join(filePath, files[i]), dirArray);
                } else {
                    dirArray.push(path.join(filePath, files[i]));
                }
            }
        } else {
            dirArray.push(filePath);
        }

        return dirArray;
    }

    static loadRoutes(routePath) {
        const fipaths = Route.throughAndThrough(routePath, []);

        for (let i = 0; i < fipaths.length; i++) {
            require(fipaths[i]);
        }

        return fipaths;
    }

}

module.exports = Route;
module.exports.routes = routes;