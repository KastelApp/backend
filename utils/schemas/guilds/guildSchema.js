const { model, Schema } = require("mongoose");

const guildSchema = new Schema({
    _id: {
        type: String,
        required: true
    }
})

module.exports = model('guild', guildSchema);