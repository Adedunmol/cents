const { BadRequestError, NotFound } = require('../errors')
const Client = require('../models/Client')
const Invoice = require('../models/Invoice')
const User = require('../models/User')
const { StatusCodes } = require('http-status-codes')
const path = require('path')
const sendMail = require('../config/mail')
const generateInvoice = require('../utils/generateInvoice')
const mailScheduleOnDueDate = require('../events/reminderMail')


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
    const { services, fullyPaid, dueDate } = req.body


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

    invoice.services = services || invoice.services
    invoice.fullyPaid = fullyPaid || invoice.fullyPaid
    invoice.dueDate = new Date(dueDate) || invoice.dueDate

    const result = await invoice.save()

    return res.status(StatusCodes.OK).json({ invoice: result })
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