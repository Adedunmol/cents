const express = require('express')
const router = express.Router()
const { createInvoice } = require('../controllers/invoice')


router.route('/:id/invoices').post(createInvoice)


module.exports = router