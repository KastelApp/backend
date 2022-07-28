const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    avatar_url: {
        type: String,
        required: false,
    },

    username: {
        type: String,
        required: true,
        default: "Unknown Username",
    },

    tag: {
        type: Number,
        required: true,
        default: 0000,
    },

    id: {
        type: String,
        required: true,
        unique: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
    },

    password: {
        type: String,
        required: true,
    },

    created_date: {
        type: Date,
        required: false,
        default: Date.now(),
    },

    privacy_settings: {
        type: Array,
        required: false,
        default: {
            two_fa: false,
            ip_lock: false,
            ip_verifiy: true
        }
    },

    ip: {
        type: String,
        required: false
    },

    badges: {
        type: Array,
        required: false
    },

    flags: {
        type: Array,
        required: false,
    },

    friends: {
        type: Array,
        required: false
    },

    dms: {
        type: Array,
        required: false
    },

    gifts: {
        type: Array,
        required: false
    },

    misc: {
        type: Array,
        required: false
    }
})

module.exports = mongoose.model('user', userSchema);