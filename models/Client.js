const mongoose = require('mongoose')


const ClientSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please provide full name']
    },
    email: {
        type: String,
        required: [true, 'Please provide email'],
        match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please provide valid email']
    },
    phoneNumber: {
        type: Number
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please provide user']
    }
}, {timestamps: true})



module.exports = mongoose.model('Client', ClientSchema)