const { model, Schema, Types } = require("mongoose");
const lengthChecker = require("../../lengthChecker");

const groupchatSchema = new Schema({
    _id: {
        type: String,
        required: true,
    },

    users: [{
        type: Types.ObjectId,
        ref: "users",
        validate: [lengthChecker({ length: 15, type: "LESS" }), '{PATH} exceeds the limit of 15']
    }]
});

module.exports = model("groupchats", groupchatSchema);