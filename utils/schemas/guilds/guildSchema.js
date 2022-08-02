const { model, Schema, Types } = require("mongoose");
const lengthChecker = require("../../lengthChecker");

const guildSchema = new Schema({
    _id: {
        type: String,
        required: true
    },

    name: {
        type: String,
        required: true,
        default: "Unknown Guild"
    },

    description: {
        type: String,
        required: false
    },

    public: {
        type: Boolean,
        required: false
    },

    verified: {
        type: Boolean,
        required: false
    },

    partnered: {
        type: Boolean,
        required: false
    },

    under_investigation: {
        type: Boolean,
        required: false
    },

    owner: {
        type: String,
        required: true,
        ref: "users"
    },

    co_owners: [{
        type: String,
        required: false,
        ref: "users",
        validate: [lengthChecker({ length: 3, type: "less" }), '{PATH} exceeds the limit of 3']
    }],

    channels: [{
        type: String,
        ref: "channels",
        required: false,
        validate: [lengthChecker({ length: 150, type: "less" }), '{PATH} exceeds the limit of 150']
    }],

    webhooks: [{
        type: String,
        required: false,
        ref: "webhooks",
        validate: [lengthChecker({ length: 350, type: "less" }), '{PATH} exceeds the limit of 350']
    }],

    roles: [{
        type: String,
        ref: "roles",
        required: false,
        validate: [lengthChecker({ length: 50, type: "less" }), '{PATH} exceeds the limit of 50']
    }],

    bans: [{
        type: String,
        ref: "bans",
        required: false,
        validate: [lengthChecker({ length: 500, type: "less" }), '{PATH} exceeds the limit of 500']
    }],

    invites: [{
        type: String,
        required: false,
        ref: "invites",
        validate: [lengthChecker({ length: 100, type: "less" }), '{PATH} exceeds the limit of 100']
    }],

    members: [{
        type: String,
        required: false,
        ref: "guildMembers",
        validate: [lengthChecker({ length: 5000, type: "less" }), '{PATH} exceeds the limit of 5000']
    }]
})

module.exports = model('guilds', guildSchema);