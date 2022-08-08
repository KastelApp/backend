const { model, Schema } = require("mongoose");

const guildMemberSchema = new Schema({
    _id: {
        type: String,
        required: true
    },

    user: {
        type: String,
        required: true,
        ref: "users"
    },

    roles: [{
        type: String,
        required: false,
        ref: "roles"
    }]
})

module.exports = model('guildMembers', guildMemberSchema);