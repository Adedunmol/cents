const { BadRequestError, NotFound } = require('../errors')
const Client = require('../models/Client')
const Invoice = require('../models/Invoice')
const User = require('../models/User')
const schedule = require('node-schedule')
const { StatusCodes } = require('http-status-codes')
const path = require('path')
const sendMail = require('../config/mail')
const generateInvoice = require('../utils/generateInvoice')
const Events = require('events')
const fs = require('fs')

const emailJobEvents = new Events()


emailJobEvents.on('not-paid', (data) => {
    //change the cron expression to run once a week
    const reminderEmailAfterDueDate = schedule.scheduleJob('*/2 * * * * *', async () => {
        const invoice = await Invoice.findOne({ _id: data }).exec()
        
        console.log(invoice.fullyPaid)
        if (invoice.fullyPaid) {
            reminderEmailAfterDueDate.cancel()
        }

        //this is going to be sending mails to the client 
        //the invoice pdf is going to be deleted from the invoices directory after sending to the client 
        console.log('invoice not paid', data)
    })
})


const mailScheduleOnDueDate = async (invoice, dueDate) => {
    
    //going to use format function from date-fns to format the date
    const newDueDate = new Date(dueDate)
    const sendMailOnDueDateJob = schedule.scheduleJob(newDueDate, async () => {
        const invoiceData = await Invoice.findOne({ _id: invoice._id }).exec()
        
        if (invoiceData.fullyPaid) {
            sendMailOnDueDateJob.cancel()
        }

        const user = await User.findOne({ _id : invoiceData.createdBy }).exec()

        emailJobEvents.emit('not-paid', invoiceData._id)
        await generateInvoice(invoiceData, path.join(__dirname, '..', 'invoices', `${invoiceData._id}.pdf`))
        
        //sending the invoice to the client here
        subject = `An invoice for the contract for ${user.fullName}`
        text = `Please check the invoice below:`
        html = `<p> Please check the invoice below: </p>`
        await sendMail(invoiceData.clientEmail, subject, text, html, invoice)
        

        //the invoice pdf is to be deleted from the invoices directory after sending to the client
        const filePath = path.join(__dirname, '..', 'invoices', `${invoiceData._id}.pdf`)
        console.log(fs.existsSync(filePath))
        fs.unlink(filePath, (err) => {
            if (err) throw err
            console.log('file has been deleted')
        })
    })
}


const createInvoice = async (req, res) => {
    const { id: clientId } = req.params
    const createdBy = req.id
    const { services, dueDate } = req.body

    if (!services || !dueDate) {
        throw new BadRequestError('Body must include services and dueDate')
    }

    if (!clientId) {
        throw new BadRequestError('ClientId is not included with url')
    }

    const client = await Client.findOne({ _id: clientId }).exec()

    if (!client) {
        throw new BadRequestError('No client with this id')
    }

    const total = services.reduce((current, obj) => current + Math.floor(obj.rate * obj.hours), 0)

    const invoice = await Invoice.create({
        clientFullName: client.fullName,
        clientEmail: client.email,
        clientPhoneNumber: client.phoneNumber,
        services: services,
        dueDate: dueDate,
        createdBy,
        createdFor: clientId,
        total
    })

    mailScheduleOnDueDate(invoice, dueDate)

    return res.status(StatusCodes.CREATED).json(invoice)
}


const getInvoice = async (req, res) => {
    const { id: clientId, invoiceId } = req.params
    const createdBy = req.id

    if (!clientId) {
        throw new BadRequestError('ClientId is not included with url')
    }

    const client = await Client.findOne({ _id: clientId }).exec()

    if (!client) {
        throw new NotFound('No client with this id')
    }

    const invoice = await Invoice.findOne({ _id: invoiceId, createdFor: client._id, createdBy }).exec()

    if (!invoice) {
        throw new NotFound('No invoice found with this id')
    }

    return res.status(StatusCodes.OK).json({ invoice })
}


const getClientInvoices = async (req, res) => {
    const { id: clientId } = req.params
    const createdBy = req.id


    if (!clientId) {
        throw new BadRequestError('ClientId is not included with url')
    }

    const client = await Client.findOne({ _id: clientId }).exec()

    if (!client) {
        throw new NotFound('No client with this id')
    }

    const invoices = await Invoice.find({ createdFor: client._id, createdBy }).exec()

    
    return res.status(StatusCodes.OK).json({ invoices, nbHits: invoices.length })
}


const getAllInvoices = async (req, res) => {
    const createdBy = req.id

    const invoices = await Invoice.find({ createdBy }).exec()

    return res.status(StatusCodes.OK).json({ invoices, nbHits: invoices.length })
}


const updateInvoice = async (req, res) => {
    const { id: clientId, invoiceId } = req.params
    const createdBy = req.id
    

    if (!clientId) {
        throw new BadRequestError('ClientId is not included with url')
    }

    const client = await Client.findOne({ _id: clientId }).exec()

    if (!client) {
        throw new NotFound('No client with this id')
    }

    const invoice = await Invoice.findOneAndUpdate({ _id: invoiceId, createdFor: client._id, createdBy }, req.body, {
        new: true,
        runValidators: true
    }).exec()

    if (!invoice) {
        throw new NotFound('No invoice found with this id')
    }

    return res.status(StatusCodes.OK).json({ invoice })
}


const sendInvoiceToClient = async (req, res) => {
    const { id: invoiceId } = req.params

    if (!clientId) {
        throw new BadRequestError('No invoice id with url')
    }

    const invoice = await Invoice.findOne({ _id: invoiceId }).exec()

    const user = await User.findOne({ _id: invoice.createdBy }).exec()

    if (!invoice) {
        throw new NotFound('No invoice with this id')
    }

    await generateInvoice(invoice, path.join(__dirname, '..', 'invoices', `${invoice._id}.pdf`))
    
    //send invoice as mail to the client here
    subject = `An invoice for the contract for ${user.fullName}`
    text = `Please check the invoice below:`
    html = `<p> Please check the invoice below: </p>`
    await sendMail(invoice.clientEmail, subject, text, html, invoice)

    //delete the invoice from the invoices directory
    fs.unlink(path.join(__dirname, '..', 'invoices', `${String(invoice._id)}.pdf`))

    return res.status(StatusCodes.OK).json({ message: 'The Invoice has been sent to the client' })
}


module.exports = {
    createInvoice,
    getInvoice,
    getClientInvoices,
    getAllInvoices,
    updateInvoice,
    sendInvoiceToClient
}