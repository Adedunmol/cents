const Invoice = require('../models/Invoice')
const User = require('../models/User')
const agenda = require('./agendaInstance')
const path = require('path')
const fs = require('fs')
const emailJobEvents = require('../events')
const sendMail = require('../config/mail')
const generateInvoice = require('../utils/generateInvoice')

const sendMailOnDueDate = async (invoiceId) => {

    const invoiceData = await Invoice.findOne({ _id: invoiceId }).exec()
        
    if (!invoiceData || invoiceData.fullyPaid) {
        console.log('cancelling job')
        agenda.cancel({ name: job.name })
        return;
    }

    const user = await User.findOne({ _id : invoiceData.createdBy }).exec()

    generateInvoice(invoiceData, path.join(__dirname, '..', 'invoices', `${invoiceData._id}.pdf`))
    
    //sending the invoice to the client here
    subject = `An invoice for the contract for ${user.fullName}`
    text = `Please check the invoice below:`
    html = `<p> Please check the invoice below: </p>`
    await sendMail(invoiceData.clientEmail, subject, text, html, invoiceData)

    //the invoice pdf is to be deleted from the invoices directory after sending to the client
    const filePath = path.join(__dirname, '..', 'invoices', `${invoiceData._id}.pdf`)
    
    fs.unlink(filePath, (err) => {
        if (err) throw err
        console.log('file has been deleted')
    })

    emailJobEvents.emit('send-reminder-mails', invoiceId)
}


const sendReminderMails = async (invoiceId) => {

    console.log(invoiceId)

    const invoice = await Invoice.findOne({ _id: invoiceId }).exec()

    console.log('gotten the invoice')
    if (!invoice || invoice.fullyPaid) {
        console.log('cancelling job')
        agenda.cancel({ name: job.name })
        return;
    }

    console.log('getting the user')
    const user = await User.findOne({ _id : invoice.createdBy }).exec()

    //this is going to be sending mails to the client 
    //the invoice pdf is going to be deleted from the invoices directory after sending to the client 
    console.log('invoice not paid')

    generateInvoice(invoice, path.join(__dirname, '..', 'invoices', `${invoice._id}.pdf`))
        
    //sending the invoice to the client here
    subject = `An invoice for the contract for ${user.fullName}`
    text = `Please check the invoice below:`
    html = `<p> Please check the invoice below: </p>`
    await sendMail(invoice.clientEmail, subject, text, html, invoice)
        

    //the invoice pdf is to be deleted from the invoices directory after sending to the client
    const filePath = path.join(__dirname, '..', 'invoices', `${invoice._id}.pdf`)
    console.log(fs.existsSync(filePath))
    fs.unlink(filePath, (err) => {
        if (err) throw err
            console.log('file has been deleted')
    })
}


module.exports = { sendMailOnDueDate, sendReminderMails }