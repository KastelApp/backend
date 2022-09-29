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

const user = require('./user');
const friend = require('./friend');
const friends = require('./friends');
const friendUser = require('./friendUser');
const ban = require('./ban');
const bans = require('./bans');
const channel = require('./channel');
const channels = require('./channels');
const guild = require('./guild');
const guilds = require('./guilds');
const guildMember = require('./guildMember');
const guildMembers = require('./guildMembers');
const invite = require('./invite');
const invites = require('./invites');
const role = require('./role');
const roles = require('./roles');

module.exports = {
    user,
    friend,
    friends,
    friendUser,
    ban,
    bans,
    channel,
    channels,
    guild,
    guilds,
    guildMember,
    guildMembers,
    invite,
    invites,
    role,
    roles,
};