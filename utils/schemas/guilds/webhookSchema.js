const { model, Schema, Types } = require("mongoose");
const lengthChecker = require("../../lengthChecker");

const webhookSchema = new Schema({
    _id: {
        type: Types.ObjectId,
        required: true
    },

    guild: {
        type: Types.ObjectId,
        required: true,
        ref: "guilds"
    },

    channel: {
        type: Types.ObjectId,
        required: true,
        ref: "channels"
    },
    
    username: {
        type: String,
        required: true,
        username: "Ghost"
    },

    token: {
        type: String,
        required: true,
        unqiue: true
    },
    
    allowed_mentions: [{
        type: String,
        validate: [lengthChecker({ length: 5, type: "less" }), '{PATH} exceeds the limit of 5']
    }]
})

module.exports = model('webhooks', webhookSchema);