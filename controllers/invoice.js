const { BadRequestError } = require('../errors')
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

    const newDueDate = new Date(dueDate)
    const sendMailOnDueDateJob = schedule.scheduleJob(newDueDate, async () => {
        const getInvoice = await Invoice.findOne({ _id: invoice._id }).exec()
        
        if (getInvoice.fullyPaid) {
            sendMailOnDueDateJob.cancel()
        }

        emailJobEvents.emit('not-paid', invoice._id)
        console.log('Sending reminder Mail')
    })

    return res.status(StatusCodes.CREATED).json(invoice)
}



module.exports = {
    createInvoice
}