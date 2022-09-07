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

const friendSchema = new Schema({
    sender: {
        type: String,
        required: true,
        ref: "users",
    },

    receiver: {
        type: String,
        required: true,
        ref: "users"
    },

    senderNickname: {
        type: String,
        required: false
    },

    receiverNickname: {
        type: String,
        required: false
    },

    accepted: {
        type: Boolean,
        required: false
    }
});

module.exports = model("friends", friendSchema);