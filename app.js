require('express-async-errors')
require('dotenv').config()

const express = require('express')
const app = express()
const mongoose = require('mongoose')
const connectDB = require('./config/connect-db')
const cookieParser = require('cookie-parser')

const notFoundMiddleware = require('./middlewares/route-not-found')
const errorHandlerMiddleware = require('./middlewares/error-handler')
const logger = require('./middlewares/logger')
const helmet = require('helmet')
const rateLimiter = require('express-rate-limit')
const cors = require('cors')
const xss = require('xss-clean')
const verifyJWT = require('./middlewares/verifyJWT')
const verifyMailConfirmed = require('./middlewares/verifyMailConfirmed')
const authRouter = require('./routes/auth')
const userRouter = require('./routes/user')
const clientRouter = require('./routes/client')
const invoiceRouter = require('./routes/invoice')
const { UnauthorizedError } = require('./errors')
const { StatusCodes } = require('http-status-codes')

const swaggerUI = require('swagger-ui-express')
const YAML = require('yamljs')
const swaggerDocument = YAML.load('./swagger.yaml')

//connect to database
connectDB(process.env.DATABASE_URI)

app.use(express.json())
app.use(cookieParser())
app.use(logger('requests.txt'))

app.use(rateLimiter({
    windowMs: 5 * 60 * 60 * 1000,
    max: 100 
}))
app.use(helmet())
app.use(cors())
app.use(xss())

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument))

app.get('/', (req, res) => {
    return res.status(StatusCodes.OK).send(`
        <h1>Cents API</h1>
        <a href="/api-docs">Documentation</a>
        `)
})


app.use('/api/v1/auth', authRouter)

app.use(verifyJWT)
app.use(verifyMailConfirmed)
app.use('/api/v1/users/', userRouter)
app.use('/api/v1/clients', clientRouter)
app.use('/api/v1/invoices', invoiceRouter)


app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)


const PORT = process.env.PORT || 3000


mongoose.connection.once('open', () => {
    console.log('Connected to Database')
    app.listen(PORT, console.log(`Server is listening on port ${PORT}`))
})