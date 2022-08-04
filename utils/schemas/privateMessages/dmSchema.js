const { model, Schema, Types } = require("mongoose");

const dmSchema = new Schema({
    _id: {
        type: Types.ObjectId,
        required: true,
    },

    user1: { // First User
        type: Types.ObjectId,
        required: true,
        ref: "users",
    },

    user2: { // Second User
        type: Types.ObjectId,
        required: true,
        ref: "users"
    }
});

module.exports = model("dm", dmSchema);