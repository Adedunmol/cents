const Agenda = require('agenda')
const allDefinitions = require('./definitions')

const agenda = new Agenda({
    db: {
        address: process.env.DATABASE_URI,
        collection: 'agendaJobs',
        options: { useUnifiedTopology: true }
    },
    maxConcurrency: 20,
    processEvery: '1 minute'
})


//check if agenda has started
agenda
.on('ready', async () => { 
    await agenda.start()
    console.log('Agenda has started')
})
.on('error', (err) => console.log('Agenda has not started', err))


//need to create the definitions(jobs) before
allDefinitions(agenda)


console.log({ definitions: agenda._definitions })


module.exports = agenda 