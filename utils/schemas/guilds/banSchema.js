const { model, Schema, Types } = require("mongoose");

const banSchema = new Schema({

    guild: {
        type: String,
        required: true,
        ref: "guilds"
    },

    user: {
        type: String,
        ref: "users"
    },

    banner: {
        type: String,
        ref: "users"
    },

    reason: {
        type: String,
        ref: "users"
    },

    banned_date: {
        type: Date,
        required: true,
        default: Date.now()
    },

    unban_date: {
        type: Date,
        required: false
    }
})

module.exports = model('bans', banSchema);