const { model, Schema } = require("mongoose");
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
        required: false,
        ref: "channels"
    }],

    roles: [{
        type: String,
        required: false,
        ref: "roles"
    }],

    invites: [{
        type: String,
        required: false,
        ref: "invites"
    }],

    bans: [{
        type: String,
        required: false,
        ref: "bans"
    }],

    members: [{
        type: String,
        required: false,
        ref: "guildMembers",
    }]
})

module.exports = model('guilds', guildSchema);