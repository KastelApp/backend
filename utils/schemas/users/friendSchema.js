const { model, Schema } = require("mongoose");

const friendSchema = new Schema({
    sender: {
        type: String,
        required: true,
        ref: "users",
    },

    receiver: {
        type: String,
        required: true,
        ref: "users"
    },

    accepted: {
        type: Boolean,
        required: false
    }
});

module.exports = model("friends", friendSchema);