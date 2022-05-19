const sendMail = require('../config/mail')
const generateInvoice = require('../utils/generateInvoice')
const Events = require('events')
const fs = require('fs')

const emailJobEvents = new Events()


emailJobEvents.on('not-paid', (data) => {
    //change the cron expression to run once a week
    const reminderEmailAfterDueDate = schedule.scheduleJob('0 0 * * 0', async () => {
        const invoice = await Invoice.findOne({ _id: data }).exec()

        if (!invoice || invoice.fullyPaid) {
            reminderEmailAfterDueDate.cancel()
        }

        const user = await User.findOne({ _id : invoice.createdBy }).exec()

        //this is going to be sending mails to the client 
        //the invoice pdf is going to be deleted from the invoices directory after sending to the client 
        console.log('invoice not paid', data)

        await generateInvoice(invoice, path.join(__dirname, '..', 'invoices', `${invoice._id}.pdf`))
        
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
    })
})


const mailScheduleOnDueDate = async (invoice, dueDate) => {
    
    //going to use format function from date-fns to format the date
    const newDueDate = new Date(dueDate)
    const sendMailOnDueDateJob = schedule.scheduleJob(newDueDate, async () => {
        const invoiceData = await Invoice.findOne({ _id: invoice._id }).exec()
        
        if (!invoiceData || invoiceData.fullyPaid) {
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


module.exports = mailScheduleOnDueDate