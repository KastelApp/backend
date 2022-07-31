const { model, Schema, Types } = require("mongoose");
const lengthChecker = require("../../lengthChecker");

const userSchema = new Schema({
    _id: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
    },

    email_verified: {
        type: Boolean,
        required: false,
    },

    username: {
        type: String,
        required: true,
        default: "Unknown Username",
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

    password: {
        type: String,
        required: true,
    },

    created_date: {
        type: Date,
        required: true,
        default: Date.now(),
    },

    date_of_birth: {
        type: Date,
        required: false,
    },

    two_fa: {
        type: String,
        required: false
    },

    two_fa_verified: {
        type: Boolean,
        required: false,
    },

    ip_verifiy: {
        type: Boolean,
        required: false,
    },

    ip_lock: {
        type: Boolean,
        required: false,
    },

    ips: {
        type: Array,
        required: false,
        validate: [lengthChecker({ length: 5, type: "less" }), '{PATH} exceeds the limit of 5'],
        index: "ips"
    },

    flags: {
        type: Array,
        required: false,
        validate: [lengthChecker({ length: 20, type: "less" }), '{PATH} exceeds the limit of 20']
    },

    guilds: [{
        type: Types.ObjectId,
        ref: "guilds",
        validate: [lengthChecker({ length: 50, type: "less" }), '{PATH} exceeds the limit of 50']
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
        required: false
    }
});

module.exports = model("users", userSchema);