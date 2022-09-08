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

const guildMemberSchema = require("../schemas/guilds/guildMemberSchema");
const guildSchema = require("../schemas/guilds/guildSchema");
const userSchema = require("../schemas/users/userSchema");
const encryption = require("../classes/encryption");
const program = require('commander');

// Program Setup
program
    .version('1.0.0', '-v, --version')
    .name('Guild Manager')

// [Command] => Create
program
    .command('create')
    .description('Create a new guild')

// [Command] => Delete
program
    .command('delete')
    .description('Delete an guild')