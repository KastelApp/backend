const { model, Schema } = require("mongoose");

const channelSchema = new Schema({
    _id: {
        type: String,
        required: true
    },

    name: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    type: {
        type: Number,
        required: true
    },

    nsfw: {
        type: Boolean,
        required: false
    },

    allowed_mentions: [{
        type: String,
        required: false
    }]
})

module.exports = model('channels', channelSchema);