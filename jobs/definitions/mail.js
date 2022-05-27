const jobHandlers = require('../handlers')


const mailDefinition = async (agenda) => {
    agenda.define('send-mail-on-due-date', jobHandlers.sendMailOnDueDate)
    agenda.define('send-reminder-mails', jobHandlers.sendReminderMails)
}

module.exports = mailDefinition