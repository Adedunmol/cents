const { BadRequestError, NotFound } = require('../errors')
const Client = require('../models/Client')
const Invoice = require('../models/Invoice')
const schedule = require('node-schedule')
const { StatusCodes } = require('http-status-codes')
const Events = require('events')

const emailJobEvents = new Events()

emailJobEvents.on('not-paid', (data) => {
    const reminderEmailAfterDueDate = schedule.scheduleJob('*/2 * * * * *', async () => {
        const invoice = await Invoice.findOne({ _id: data }).exec()
        
        if (invoice.fullyPaid) {
            reminderEmailAfterDueDate.cancel()
        }
        console.log('invoice not paid', data)
    })
})


const mailScheduleOnDueDate = async (dueDate) => {
    
    //going to use format function from date-fns to format the date
    const newDueDate = new Date(dueDate)
    const sendMailOnDueDateJob = schedule.scheduleJob(newDueDate, async () => {
        const getInvoice = await Invoice.findOne({ _id: invoice._id }).exec()
        
        if (getInvoice.fullyPaid) {
            sendMailOnDueDateJob.cancel()
        }

        emailJobEvents.emit('not-paid', invoice._id)
        console.log('Sending reminder Mail')
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

    const client = await Client.findOne({ clientId }).exec()

    if (!client) {
        throw new BadRequestError('No client with this id')
    }

    const invoice = await Invoice.create({
        clientFullName: client.fullName,
        clientEmail: client.email,
        clientPhoneNumber: client.phoneNumber,
        services: services,
        dueDate: dueDate,
        createdBy,
        createdFor: clientId
    })

    mailScheduleOnDueDate(dueDate)

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


const editInvoice = async (req, res) => {
    const { id: clientId, invoiceId } = req.params
    const createdBy = req.id
    const {} = req.body

    const update = {}

    if (!clientId) {
        throw new BadRequestError('ClientId is not included with url')
    }

    const client = await Client.findOne({ _id: clientId }).exec()

    if (!client) {
        throw new NotFound('No client with this id')
    }

    const invoice = await Invoice.findOneAndUpdate({ _id: invoiceId, createdFor: client._id, createdBy }).exec()

    if (!invoice) {
        throw new NotFound('No invoice found with this id')
    }

    return res.status(StatusCodes.OK).json({ invoice })
}


module.exports = {
    createInvoice,
    getInvoice,
    getClientInvoices,
    getAllInvoices
}