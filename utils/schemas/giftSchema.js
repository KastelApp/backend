const mongoose = require("mongoose");

const giftSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true,
        ref: "users",
    },
    type: {
        type: String,
        required: true,
    },
    max_age: {
        type: Date,
        required: true,
    },
    gift_length: {
        type: Date,
        required: true,
    },
    gift_url: {
        type: String,
        required: true,
    },
    used_by: {
        type: String,
        required: true,
        ref: "users"
    }
});

module.exports = mongoose.model("gifts", giftSchema);