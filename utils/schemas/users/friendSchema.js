const { model, Schema, Types } = require("mongoose");

const friendSchema = new Schema({
    user: {
        type: Types.ObjectId,
        required: true,
        ref: "users",
    },

    friend: {
        type: Types.ObjectId,
        required: true,
        ref: "users"
    }
});

module.exports = model("friends", friendSchema);