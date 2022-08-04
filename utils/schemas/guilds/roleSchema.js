const { model, Schema, Types } = require("mongoose");

const roleSchema = new Schema({
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
        required: true,
        default: "Unknown Role"
    },

    allowed_nsfw: {
        type: Boolean,
        required: false
    },

    deleteable: {
        type: Boolean,
        required: false
    },

    allowed_mentions: [{
        type: String,
        required: false
    }],

    hoisted: {
        type: Boolean,
        required: false
    },

    color: {
        type: String,
        required: false
    }
})

module.exports = model('roles', roleSchema);