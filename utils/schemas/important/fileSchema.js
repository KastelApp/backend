const { model, Schema } = require("mongoose");

const fileSchema = new Schema({
    _id: {
        type: String,
        required: true
    },

    message: {
        type: String,
        required: true,
        ref: "messages"
    },

    name: {
        type: String,
        required: true,
        default: "Unknown"
    },

    cdn_url: {
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