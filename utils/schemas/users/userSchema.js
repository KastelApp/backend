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

const { model, Schema } = require("mongoose");
const lengthChecker = require("../../lengthChecker");

const userSchema = new Schema({
    _id: { // Encrypted
        type: String,
        required: true
    },

    email: { // Encrypted
        type: String,
        required: true,
        unique: true,
    },

    email_verified: {
        type: Boolean,
        required: false,
    },

    username: { // Encrypted
        type: String,
        required: true,
        default: "Ghost",
    },

    tag: {
        type: String,
        required: true,
        default: "0000",
    },

    avatar_url: {
        type: String,
        required: false,
    },

    password: { // Hashed
        type: String,
        required: true,
    },

    phone_number: { // Encrypted
        type: String,
        required: false
    },

    created_date: {
        type: Date,
        required: true,
        default: Date.now(),
    },

    date_of_birth: { // Encrypted
        type: String,
        required: false,
    },

    two_fa: {
        type: Boolean,
        required: false
    },

    two_fa_verified: {
        type: Boolean,
        required: false,
    },

    twofa_secret: { // Encrypted
        type: String,
        required: false
    },

    ip_verify: {
        type: Boolean,
        required: false,
    },

    ip_lock: {
        type: Boolean,
        required: false,
    },

    ips: { // Encrypted
        type: Array,
        required: false,
        index: "ips"
    },

    flags: {
        type: Array,
        required: false,
    },

    badges: {
        type: Number,
        required: false,
        default: 0
    },

    guilds: [{
        type: String,
        ref: "guilds",
    }],

    dms: [{
        type: String,
        required: false,
        ref: "dms"
    }],

    groupchats: [{
        type: String,
        required: false,
        ref: "groupchats"
    }],

    bots: [{
        type: String,
        ref: "users"
    }],

    banned: {
        type: Boolean,
        required: false,
    },

    ban_reason: {
        type: String,
        required: false,
    },

    locked: {
        type: Boolean,
        required: false,
    },

    account_deletion_in_progress: {
        type: Boolean,
        required: false,
    },

    show_ads: {
        type: Boolean,
        required: false,
    },

    bot: {
        type: Boolean,
        required: false
    }
});

module.exports = model("users", userSchema);