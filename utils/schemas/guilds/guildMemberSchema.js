const { model, Schema, Types } = require("mongoose");

const guildMemberSchema = new Schema({
    user: {
        type: Types.ObjectId,
        required: true,
        ref: "users"
    },

    guild: {
        type: Types.ObjectId,
        required: true,
        ref: "guilds"
    },

    roles: [{
        type: Types.ObjectId,
        required: false,
        ref: "roles"
    }]
})

module.exports = model('guildMembers', guildMemberSchema);