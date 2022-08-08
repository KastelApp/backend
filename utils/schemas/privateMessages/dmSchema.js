const { model, Schema } = require("mongoose");

const dmSchema = new Schema({
    _id: {
        type: String,
        required: true,
    },

    creator: { // First User
        type: String,
        required: true,
        ref: "users",
    },

    receiver: { // Second User
        type: String,
        required: true,
        ref: "users"
    }
});

module.exports = model("dm", dmSchema);