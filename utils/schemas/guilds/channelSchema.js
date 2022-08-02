const { model, Schema, Types } = require("mongoose");

const channelSchema = new Schema({
    _id: {
        type: String,
        required: true
    },

    guild: {
        type: String,
        required: true,
        ref: "guilds"
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
        type: String,
        required: true
    },

    nsfw: {
        type: Boolean,
        required: true
    },

    allowed_mentions: [{
        type: String,
        required: false
    }],

    messages: [{
        type: String,
        ref: "messages"
    }]
})

module.exports = model('channels', channelSchema);