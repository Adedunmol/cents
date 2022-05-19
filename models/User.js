const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please provide full name']
    },
    email: {
        type: String,
        required: [true, 'Please provide email'],
        unique: true,
        match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please provide valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide password']
    },
    roles: {
        User: {
            type: Number,
            default: 1984
        },
        Moderator: Number,
        Admin: Number
    },
    confirmed: {
        type: Boolean,
        default: false
    },
    refreshToken: [String]
})



module.exports = mongoose.model('User', UserSchema)