const { model, Schema, Types } = require("mongoose");

const fileSchema = new Schema({
    _id: {
        type: Types.ObjectId,
        required: true
    },

    message: {
        type: Types.ObjectId,
        required: true,
        ref: "messages"
    },

    name: {
        type: String,
        required: true,
        default: "Unknown"
    },

    cdn_token: {
        type: String,
        required: true
    },

    type: {
        type: String,
        required: true
    },

    deleted: {
        type: Boolean,
        required: false
    }
})

module.exports = model('files', fileSchema);