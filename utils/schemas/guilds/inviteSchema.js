const { model, Schema, Types } = require("mongoose");

const inviteSchema = new Schema({
    _id: { // The Code
        type: String,
        required: true
    },

    guild: {
        type: String,
        required: true,
        ref: "guilds"
    },

    expires: {
        type: Date,
        required: false
    },

    uses: {
        type: Number,
        required: false
    },

    max_uses: {
        type: Number,
        required: false
    },

    creator: {
        type: Types.ObjectId,
        ref: "guildMembers"
    }
})

module.exports = model('invites', inviteSchema);