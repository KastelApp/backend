const { model, Schema } = require("mongoose");

const dmSchema = new Schema({
    _id: {
        type: String,
        required: true,
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
    }
});

module.exports = model("dm", dmSchema);