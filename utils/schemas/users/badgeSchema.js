const { model, Schema } = require("mongoose");

const badgeSchema = new Schema({
    user: {
        type: String,
        required: true,
        ref: "users",
    },

    name: {
        type: String,
        required: true,
        default: "Badge name here",
    },

    short_description: {
        type: String,
        required: true,
        default: "Short Description here",
    },

    small_image: {
        type: String,
        required: true,
    },

});

module.exports = model("badges", badgeSchema);