const { model, Schema } = require("mongoose");

const friendSchema = new Schema({
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

module.exports = model("friends", friendSchema);