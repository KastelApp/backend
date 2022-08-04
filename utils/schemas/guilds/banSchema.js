const { model, Schema, Types } = require("mongoose");

const banSchema = new Schema({

    guild: {
        type: Types.ObjectId,
        required: true,
        ref: "guilds"
    },

    user: {
        type: Types.ObjectId,
        ref: "users",
        required: true
    },

    banner: {
        type: Types.ObjectId,
        ref: "users",
        required: true
    },

    reason: {
        type: String,
        required: false
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