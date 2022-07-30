const mongoose = require("mongoose");

const friendSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true,
        ref: "users",
    },

    friend: {
        type: String,
        required: true,
        ref: "users"
    }
});

module.exports = mongoose.model("friends", friendSchema);