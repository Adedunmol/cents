const { StatusCodes } = require('http-status-codes')
const { UnauthorizedError, BadRequestError } = require('../errors')
const Client = require('../models/Client')
const Invoice = require('../models/Invoice')


const getAllClients = async (req, res) => {
    const createdBy = req.id

    const clients = await Client.find({ createdBy }).sort("createdAt")

    return res.status(StatusCodes.OK).json({ clients, nbHits: clients.length })
}


const getClient = async (req, res) => {
    const createdBy = req.id
    const { id: clientID } = req.params

    if (!clientID) {
        throw new BadRequestError('no id with url')
    }

    const client = await Client.findOne({ _id: clientID, createdBy }).exec()

    return res.status(StatusCodes.OK).json({ client })
}


const createClient = async (req, res) => {
    const createdBy = req.id
    const { fullName, email, phoneNumber } = req.body

    if (!createdBy) {
        throw new UnauthorizedError('Not allowed to access this route')
    }

    if (!fullName || !email) {
        throw new BadRequestError('Body must include fullName and email')
    }

    const result = await Client.create({
        fullName,
        email,
        phoneNumber,
        createdBy
    })

    return res.status(StatusCodes.CREATED).json(result)
}


const deleteClient = async (req, res) => {
    const createdBy = req.id
    const { id: clientID } = req.params

    if (!clientID) {
        throw new BadRequestError('No id with URL')
    }

    const invoices = await Invoice.findOneAndDelete({ createdBy, createdFor: clientID }).exec()
    const client = await Client.findOneAndDelete({ createdBy, _id: clientID }).exec()

    if (!client) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'No client with this Id' })
    }

    return res.status(StatusCodes.OK).json({ message: 'Client has been deleted' })
}


const updateClient = async (req, res) => {
    const createdBy = req.id
    const { id: clientID } = req.params
    const { fullName, email, phoneNumber } = req.body

    if (!clientID) {
        throw new BadRequestError('No id with URL')
    }

    const invoices = await Invoice.find({ createdFor: clientID, createdBy }).exec()
    const client = await Client.findOne({ createdBy, _id: clientID }).exec()

    const newInvoices = invoices.forEach(invoice => {
        invoice.clientFullName = fullName || client.fullName
        invoice.clientEmail = email || client.email
        invoice.clientPhoneNumber = phoneNumber || client.phoneNumber
    })
    
    client.fullName = fullName || client.fullName
    client.email = email || client.email
    client.phoneNumber = phoneNumber || client.phoneNumber

    const clientResult = await client.save()

    if (!newInvoices) {
        //there are no invoices associated with the client 
    }else {
        const invoiceResult = await newInvoices.save()
    }

    return res.status(StatusCodes.OK).json({ client: clientResult })
}


module.exports = {
    getClient,
    createClient,
    getAllClients,
    deleteClient,
    updateClient
}