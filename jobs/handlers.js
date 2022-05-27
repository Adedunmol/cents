const { sendMailOnDueDate, sendReminderMails } = require('./mailHandler')


const jobHandlers = {
    sendMailOnDueDate: async (job, done) => { 
    
        console.log(`Running at: ${Date()}`)
        const invoiceId = job.attrs.data.id 

        await sendMailOnDueDate(invoiceId)

        console.log('job done')
        done()
    },

    sendReminderMails: async (job, done) => {

        const invoiceId = job.attrs.data.id
        console.log(`Reminder mails: ${invoiceId}`)

        await sendReminderMails(invoiceId)

        console.log('reminder mails done')
        done()
    }
}


module.exports = jobHandlers