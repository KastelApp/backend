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
const { ALLOWED_MENTIONS } = require("../../../constants");

const messageSchema = new Schema({
    _id: {
        type: String,
        required: true
    },

    author: {
        type: String,
        required: true,
        ref: "users"
    },

    content: {
        type: String,
        required: true
    },

    allowed_mentions: {
        type: Number,
        required: false,
        default: ALLOWED_MENTIONS.ALL
    },

    created_date: {
        type: Date,
        required: true,
        default: Date.now()
    },

    updated_date: {
        type: Date,
        required: true,
        default: Date.now()
    },

    channel: {
        type: String,
        required: true,
        ref: "channels"
    },

    // Files and Embeds are currently in BETA
    // files: [{
    //     type: String,
    //     required: true,
    //     ref: "files"
    // }],

    // embeds: []


})

module.exports = model('messages', messageSchema);