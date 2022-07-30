const mongoose = require("mongoose");

const dmSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        unique: true,
    },

    user1: { // First User
        type: String,
        required: true,
        ref: "users",
    },

    user2: { // Second User
        type: String,
        required: true,
        ref: "users"
    },
});

module.exports = mongoose.model("dms", dmSchema);