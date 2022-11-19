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

const requiredVersion = '19';
const requiredUpdate = true;
const path = require('node:path');
const fs = require('node:fs');
const colors = require('./log');

/**
 * @typedef {Object} PathsPath
 * @property {string} path The Path of the item
 * @property {Function} errorFunc The Function to run when there is a error finding the path
 */

/**
 * @type {{node_modules: PathsPath, constants: PathsPath, config: PathsPath}}
 */
const paths = {
    node_modules: {
        path: path.join(__dirname, '../../node_modules'),
        errorFunc: () => {
            console.error(`${colors('red', '[ERROR]')} ${colors('blue', 'Please Install Node Modules before running Kastel')}`);
            process.exit();
        },
    },
    constants: {
        path: path.join(__dirname, '../constants.js'),
        errorFunc: () => {
            const backupPath = path.join(__dirname, './backups/backup_constants.js');
            const backupConstants = fs.existsSync(path.join(__dirname, './backups/backup_constants.js'));

            console.warn(`${colors('yellow', '[WARNING]')} ${colors('blue', `It seems you have deleted Constants.js, ${backupConstants ? 'A Backup Will be attempted to be restored Please wait...' : 'The backup also seems to have been deleted, Please re-add these files!'}`)}`);

            if (!backupConstants) process.exit();

            const backupContents = fs.readFileSync(backupPath, 'utf-8');

            fs.writeFileSync(path.join(__dirname, '../constants.js'), backupContents);

            console.log(`${colors('green', '[SUCCESS]')} ${colors('blue', 'The backup of constants has been restored, Please restart Kastel.')}`);
            process.exit();
        },
    },
    config: {
        path: path.join(__dirname, '../config.js'),
        errorFunc: () => {
            const examplePath = path.join(__dirname, '../config.example.js');
            const exampleConfig = fs.existsSync(examplePath);

            if (exampleConfig) {
                console.warn(`${colors('red', '[WARNING]')} ${colors('blue', 'It seems you have not filled out the example config file, We have gone ahead and renamed it for you! Please fill it out before restarting Kastel')}`);

                fs.renameSync(examplePath, path.join(__dirname, '../config.js'));

                process.exit();
            } else if (!exampleConfig) {
                console.warn(`${colors('red', '[WARNING]')} ${colors('blue', 'It seems that the example config and normal config have been deleted, A Backup Will be attempted to be restored')}`);

                const backupPath = path.join(__dirname, './backups/backup_config.js');
                const backupContent = fs.readFileSync(backupPath, 'utf-8');

                if (!backupContent) {
                    console.error(`${colors('red', '[ERROR]')} ${colors('blue', 'It seems the backup config file has been deleted, Please re-add these files.')}`);
                    process.exit();
                }

                fs.writeFileSync(path.join(__dirname, '../config.js'), backupContent);

                console.log(`${colors('green', '[SUCCESS]')} ${colors('blue', 'The backup of config.js has been restored, Please fill it out and restart Kastel.')}`);
                process.exit();
            }
        },
    },
};

const nodeVersion = process.versions.node.split('.')[0];

if (nodeVersion < requiredVersion) {
    // We will only Warn the user they are running an outdated version
    // Mainly in case its like one version out of date (Normally it won't cause a ton of issues)
    console.warn(`${colors('red', `[${requiredUpdate ? 'Error' : 'Warning'}]`)} ${colors('blue', `You are using a out of date Node.Js Version, ${requiredUpdate ? 'Please Update as you will run into errors' : 'Please update else you may run into errors.'}`)}`);
    console.warn(`${colors('red', `[${requiredUpdate ? 'Error' : 'Warning'}]`)} ${colors('blue', `You are using Node.Js Version ${nodeVersion}, Kastel requires Node.Js Version ${requiredVersion} or higher`)}`);

    if (requiredUpdate) process.exit();
}

for (const p in paths) {
    /**
     * @type {PathsPath}
     */
    const pat = paths[p];

    if (fs.existsSync(pat.path)) continue;

    pat.errorFunc();
}

if (!(nodeVersion < requiredVersion) && process.argv.includes('-checks')) {
    console.log(`${colors('green', '[SUCCESS]')} ${colors('blue', 'All Checks have been passed!')}`);
}