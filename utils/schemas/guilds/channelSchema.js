const { model, Schema, Types } = require("mongoose");

const channelSchema = new Schema({
    _id: {
        type: Types.ObjectId,
        required: true
    },

    guild: {
        type: Types.ObjectId,
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