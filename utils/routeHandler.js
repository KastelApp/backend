const fs = require("node:fs");
const path = require("node:path");

/**
 * Goes through each DIR and adds them to the Array.
 * @param {String} file 
 * @param {Array<String>} arr 
 */
const thrandthr = (fipath, arr) => {
    const dirArray = arr || [];

    const filePath = fipath || path.join(__dirname, "..", "routes")

    const fileInfo = fs.statSync(filePath)

    if (fileInfo.isDirectory()) {
        const files = fs.readdirSync(filePath)
        for (let i = 0; i < files.length; i++) {
            const fi = fs.statSync(path.join(filePath, files[i]));

            if (fi.isDirectory()) {
                thrandthr(path.join(filePath, files[i]), dirArray)
            } else {
                dirArray.push(path.join(filePath, files[i]))
            }
        }

    } else {
        dirArray.push(filePath)
    }

    return dirArray
}

/**
 * Cuts the filePath, and adds the export path to make a propper route
 * @param {String} filePath 
 * @param {String} exportPath 
 */
const cutter = (filePath, exportPath) => {

    const splitPath = filePath.split("/routes").pop().split("/")

    splitPath.shift() // shift it once to remove the ('')
    splitPath.pop() // pop it to remove the .js file part (example.js)

    return splitPath.length >= 1 ? `/${splitPath.join("/")}${exportPath.startsWith("/") ? exportPath : "/" + exportPath}` : `${exportPath}`
}

/**
 * Loads all the routes.
 * @param {import("express").Application} app 
 */
const routeHandler = (app) => {
    const fipaths = thrandthr(null, []);

    for (let i = 0; i < fipaths.length; i++) {
        const route = require(fipaths[i]);
        const newPath = cutter(fipaths[i], route.path)

        if (process?.env?.routedebug == "true") console.log(newPath)

        if (!route?.method && route?.methods) {
            for (const method of route.methods) {
                app[method](newPath, ...route.middleWare, (...args) => route.run(...args, app))
            }
        } else {
            app[route.method](newPath, ...route.middleWare, (...args) => route.run(...args, app))
        }

        if (process?.env?.logRoutes == "true") {
            logger.loaded(`${newPath} (${route?.method || route?.methods.join(", ")})`)
        }
    }
}



module.exports = routeHandler;