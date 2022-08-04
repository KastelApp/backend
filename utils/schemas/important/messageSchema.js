const { model, Schema, Types } = require("mongoose");

const messageSchema = new Schema({
    _id: {
        type: Types.ObjectId,
        required: true
    },

    channel: {
        type: Types.ObjectId,
        required: true,
        ref: "channels"
    }
})

module.exports = model('messages', messageSchema);