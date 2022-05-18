const mongoose = require('mongoose')


const InvoiceSchema = new mongoose.Schema({
    clientFullName: {
        type: String,
        required: [true, 'Please provide full name']
    },
    clientEmail: {
        type: String,
        required: [true, 'Please provide email'],
        match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please provide valid email']
    },
    clientPhoneNumber: {
        type: Number
    },
    services: [{
        item: String,
        rate: Number,
        hours: Number,
        paid: {
            type: Boolean,
            default: false
        }
    }],
    total: {
        type: Number
    },
    dueDate: Date,
    fullyPaid: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please provide user']
    },
    createdFor: {
        type: mongoose.Types.ObjectId,
        ref: 'Client',
        required: [true, 'Please provide client']
    }
}, {timestamps: true})


//mongoose pre save middleware
//this checks if all the services have been paid for and sets the invoice fullyPaid to be true
//not working yet
InvoiceSchema.pre('updateOne', async function() {

    console.log(this)
    result = this.services.filter(service => service.paid !== true)
    console.log(result)
    // if (result.length < 1) {
    //     this.fullyPaid = true 
    // }
})


module.exports = mongoose.model('Invoice', InvoiceSchema)