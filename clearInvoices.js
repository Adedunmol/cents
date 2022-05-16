require('dotenv').config()

const connectDB = require('./config/connect-db')
const Invoice = require('./models/Invoice')


const deleteInvoices = async () => {
    await connectDB(process.env.DATABASE_URI)
    
    const result = await Invoice.deleteMany()
    process.exit(1)
}

deleteInvoices()