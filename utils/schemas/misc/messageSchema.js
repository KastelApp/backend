const { model, Schema } = require("mongoose");

const messageSchema = new Schema({
    _id: {
        type: String,
        required: true
    },

    channel: {
        type: String,
        required: true,
        ref: "channels"
    }
})

module.exports = model('messages', messageSchema);