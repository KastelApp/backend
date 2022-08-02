const { model, Schema } = require("mongoose");

const guildMemberSchema = new Schema({
    user: {
        type: String,
        required: true,
        ref: "users"
    },

    guild: {
        type: String,
        required: true,
        ref: "guilds"
    },

    roles: [{
        type: String,
        required: false,
        ref: "roles"
    }],

    bannable: {
        type: Boolean,
        required: false
    },

    kickable: {
        type: Boolean,
        required: false
    }
})

module.exports = model('guildMembers', guildMemberSchema);