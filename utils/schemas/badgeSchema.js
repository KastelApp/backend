const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema({
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

module.exports = mongoose.model("badges", badgeSchema);