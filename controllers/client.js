const { StatusCodes } = require('http-status-codes')
const { UnauthorizedError, BadRequestError } = require('../errors')
const Client = require('../models/Client')


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


module.exports = {
    getClient,
    createClient,
    getAllClients
}