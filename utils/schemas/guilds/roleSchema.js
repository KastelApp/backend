const { model, Schema } = require("mongoose");

const roleSchema = new Schema({
    _id: {
        type: String,
        required: true
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