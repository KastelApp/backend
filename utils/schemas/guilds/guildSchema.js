const { model, Schema, Types } = require("mongoose");
const lengthChecker = require("../../lengthChecker");

const guildSchema = new Schema({
    _id: {
        type: Types.ObjectId,
        required: true
    },

    name: {
        type: String,
        required: true,
        default: "Unknown Guild"
    },

    description: {
        type: String,
        required: false
    },

    public: {
        type: Boolean,
        required: false
    },

    verified: {
        type: Boolean,
        required: false
    },

    partnered: {
        type: Boolean,
        required: false
    },

    under_investigation: {
        type: Boolean,
        required: false
    },

    owner: {
        type: Types.ObjectId,
        required: true,
        ref: "users"
    },

    co_owners: [{
        type: Types.ObjectId,
        required: false,
        ref: "users",
        validate: [lengthChecker({ length: 3, type: "less" }), '{PATH} exceeds the limit of 3']
    }]
})

module.exports = model('guilds', guildSchema);