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

const { hash } = require('bcrypt');
const userSchema = require("../schemas/users/userSchema");
const encryption = require("../classes/encryption");
const program = require('commander');

/**
 * 
 * @param {Object} options
 * @param {String} options.email 
 * @param {String} options.password 
 * @param {String} options.username 
 * @param {String} options.tag 
 * @param {String} options.phone 
 */
const createAccount = (options) => {}

/**
 * 
 * @param {Object} options The options for deleting the account
 * @param {String} options.id The accounts ID
 * @param {Boolean} options.ghost If they want to ghost the account or completely wipe it
 */
const deleteAccount = (options) => {}

// Program Setup
program
    .version('1.0.0', '-v, --version')
    .name('Account Manager')

// [Command] => Create
program
    .command('create')
    .description('Create a brand new account')
    .requiredOption('-e, --email <email>', 'The email linked to the account')
    .requiredOption('-p, --password <password>', 'The accounts password')
    .requiredOption('-u, --username <username>', 'The username of the account')
    .option('-t, --tag [tag]', 'The Accounts tag')
    .option('-ph, --phone', 'The phone number the account will have')
    .action((cmdObj) => {
        console.log(cmdObj)
    });

// [Command] => Delete
program
    .command('delete')
    .description('Delete an account')
    .requiredOption("-i, --id <id>", 'The ID of the account you want to delete')
    .option("-g, --ghost [ghost]", 'If you want to ghost the account or not (\'Ghosting is removing all important data.\')', true)
    .action((cmdObj) => {
        console.log(cmdObj)
    });

// [Command] => Ban
program
    .command('ban')
    .description('Ban an account')
    .option('-r, --reason <reason>', 'The reason of the ban')


program.parse(process.argv)