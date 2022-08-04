const { model, Schema, Types } = require("mongoose");

const giftSchema = new Schema({

    _id: { // The gift token/id
      type: Types.ObjectId,
      required: true  
    },

    user: {
        type: Types.ObjectId,
        required: true,
        ref: "users",
    },

    type: {
        type: Number,
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

    used_by: {
        type: Types.ObjectId,
        required: true,
        ref: "users"
    }
});

module.exports = model("gifts", giftSchema);