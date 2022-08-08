const { model, Schema } = require("mongoose");

const banSchema = new Schema({
    _id: {
        type: String,
        required: true
    },

    user: {
        type: String,
        ref: "users",
        required: true
    },

    banner: {
        type: String,
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