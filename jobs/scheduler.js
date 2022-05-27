const agenda = require("./agendaInstance")


const scheduler = {
    dueDateMail: async (invoice, date) => {
        // parse the date using date-fns
        const dueDate = new Date(date)
        
        await agenda.schedule(dueDate, 'send-mail-on-due-date', { id: invoice._id })
    },

    reminderMails: async (invoiceId) => {
        
        await agenda.every('1 week', 'send-reminder-mails', { id: invoiceId })
    }
}

module.exports = scheduler