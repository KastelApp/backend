const { model, Schema, Types } = require("mongoose");

const inviteSchema = new Schema({
    _id: { // The Code
        type: Types.ObjectId,
        required: true
    },

    guild: {
        type: Types.ObjectId,
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